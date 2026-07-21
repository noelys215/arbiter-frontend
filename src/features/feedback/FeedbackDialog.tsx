import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type FormEvent, type RefObject } from "react";
import { AppTextArea, AppTextField } from "../../components/ui/AppField";
import AppModal, { AppModalBody, AppModalFooter, AppModalHeader, AppModalHeading } from "../../components/ui/AppModal";
import { AppCheckbox, AppRadio, AppRadioGroup } from "../../components/ui/AppSelection";
import { buildFeedbackDiagnostics } from "./feedbackDiagnostics";
import {
  submitFeedback,
  type FeedbackSource,
  type FeedbackType,
} from "./feedback.api";

type FeedbackDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  source: FeedbackSource;
  isAuthenticated?: boolean;
  selectedGroupId?: string | null;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const TYPE_OPTIONS: Array<{ value: FeedbackType; label: string }> = [
  { value: "feedback", label: "General feedback" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature idea" },
];

const MESSAGE_LABELS: Record<FeedbackType, string> = {
  feedback: "What would you like to share?",
  bug: "What happened?",
  feature: "What would you like Arbiter to do?",
};

const MESSAGE_PLACEHOLDERS: Record<FeedbackType, string> = {
  feedback: "Tell us what’s working or what could be better…",
  bug: "Describe what you expected and what happened instead…",
  feature: "Share the idea you’d find useful…",
};

const newSubmissionId = () => window.crypto.randomUUID();

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getErrorMessage(error: unknown) {
  const status =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: number }).status
      : undefined;
  if (status === 429) {
    return "You’ve sent several messages recently. Please try again later.";
  }
  if (status === 422 || status === 413) {
    return "Please review your feedback and try again.";
  }
  return "We couldn’t send your feedback. Please try again.";
}

export default function FeedbackDialog({
  isOpen,
  onOpenChange,
  source,
  isAuthenticated = false,
  selectedGroupId,
  returnFocusRef,
}: FeedbackDialogProps) {
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [allowContact, setAllowContact] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false);
  const [diagnosticsTouched, setDiagnosticsTouched] = useState(false);
  const [website, setWebsite] = useState("");
  const [submissionId, setSubmissionId] = useState(newSubmissionId);
  const [attempted, setAttempted] = useState(false);
  const [sentWithContact, setSentWithContact] = useState(false);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const cleanedMessage = message.trim();
  const messageInvalid = attempted && cleanedMessage.length < 10;
  const emailInvalid =
    attempted && allowContact && !isAuthenticated && !isValidEmail(contactEmail);

  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      setSentWithContact(allowContact);
      window.requestAnimationFrame(() => successHeadingRef.current?.focus());
    },
  });

  const reset = () => {
    setType("feedback");
    setMessage("");
    setAllowContact(false);
    setContactEmail("");
    setIncludeDiagnostics(false);
    setDiagnosticsTouched(false);
    setWebsite("");
    setSubmissionId(newSubmissionId());
    setAttempted(false);
    setSentWithContact(false);
    mutation.reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && mutation.isPending) return;
    onOpenChange(open);
    if (!open) {
      reset();
      window.requestAnimationFrame(() => returnFocusRef?.current?.focus());
    }
  };

  const handleTypeChange = (value: string) => {
    const nextType = value as FeedbackType;
    setType(nextType);
    if (!diagnosticsTouched) setIncludeDiagnostics(nextType === "bug");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    const invalidEmail =
      allowContact && !isAuthenticated && !isValidEmail(contactEmail.trim());
    if (cleanedMessage.length < 10 || invalidEmail || mutation.isPending) return;

    mutation.mutate({
      submission_id: submissionId,
      type,
      message: cleanedMessage,
      allow_contact: allowContact,
      ...(allowContact && !isAuthenticated
        ? { contact_email: contactEmail.trim() }
        : {}),
      include_diagnostics: includeDiagnostics,
      ...(includeDiagnostics
        ? { diagnostics: buildFeedbackDiagnostics(source, selectedGroupId) }
        : {}),
      website,
    });
  };

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      ariaLabel="Share feedback"
      size="lg"
      isDismissable={!mutation.isPending}
      isKeyboardDismissDisabled={mutation.isPending}
      placement="auto"
      classes={{
        dialog: "feedback-dialog max-h-[calc(100dvh-1.5rem)] !max-w-[44rem] border border-[#E0B15C]/20 bg-[#1C110F]",
        container: "items-end pb-4 sm:items-center sm:pb-0",
        backdrop: "bg-black/38",
        closeButton:
          "feedback-close-button min-h-11 min-w-11 text-[#EAD9BC] hover:bg-[#E0B15C]/10 hover:text-[#F7EAD2]",
      }}
    >
      {(onClose) =>
          mutation.isSuccess ? (
            <>
              <AppModalHeader className="sr-only"><AppModalHeading>Feedback sent</AppModalHeading></AppModalHeader>
              <AppModalBody className="feedback-dialog-body feedback-success py-10 sm:py-14">
                <p className="landing-eyebrow">Thank you</p>
                <AppModalHeading
                  ref={successHeadingRef}
                  tabIndex={-1}
                  className="app-heading-serif text-3xl text-[#F7EAD2] sm:text-4xl"
                >
                  Thanks for helping improve Arbiter.
                </AppModalHeading>
                <p className="app-text-secondary">Your feedback has been sent.</p>
                {sentWithContact ? (
                  <p className="text-sm app-text-metadata">
                    We may follow up at the email you provided.
                  </p>
                ) : null}
              </AppModalBody>
              <AppModalFooter className="feedback-dialog-footer">
                <Button className="app-primary-button" size="lg" onPress={onClose}>
                  Done
                </Button>
              </AppModalFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="contents" noValidate>
              <AppModalHeader className="feedback-dialog-header flex flex-col items-start gap-0.5">
                <AppModalHeading className="app-heading-serif text-3xl text-[#F7EAD2]">
                  Share feedback
                </AppModalHeading>
                <p className="text-sm font-normal app-text-secondary">
                  Help make Arbiter better.
                </p>
              </AppModalHeader>
              <AppModalBody className="feedback-dialog-body space-y-4">
                <AppRadioGroup
                  label="What would you like to send?"
                  value={type}
                  onChange={handleTypeChange}
                  name="feedback-type"
                  orientation="horizontal"
                  className="feedback-type-options"
                  labelClassName="text-sm font-semibold text-[#F7EAD2]"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <AppRadio
                      key={option.value}
                      value={option.value}
                      className="feedback-type-option"
                      labelClassName="feedback-type-label feedback-type-radio"
                      controlClassName="feedback-type-indicator border-[#E0B15C]/48 data-[selected=true]:border-[#E0B15C] data-[selected=true]:bg-[#E0B15C]"
                    >
                      {option.label}
                    </AppRadio>
                  ))}
                </AppRadioGroup>

                <AppTextArea
                  isRequired
                  label={MESSAGE_LABELS[type]}
                  placeholder={MESSAGE_PLACEHOLDERS[type]}
                  value={message}
                  onChangeValue={setMessage}
                  rows={3}
                  maxLength={4000}
                  isInvalid={messageInvalid}
                  errorMessage={messageInvalid ? "Please add a little more detail." : undefined}
                  description={`${message.length.toLocaleString()} / 4,000`}
                  classes={{
                    label: "feedback-field-label",
                    input: "feedback-message-input text-base",
                    inputWrapper:
                      "feedback-field-wrapper border-[#E0B15C]/32 bg-[#22130F]",
                    description: "feedback-character-count",
                    error: "feedback-error-message",
                  }}
                />

                <div className="feedback-consent-group">
                  <AppCheckbox
                    selected={allowContact}
                    onChange={setAllowContact}
                    aria-describedby="feedback-contact-helper"
                    className="feedback-checkbox min-h-11"
                    controlClassName="feedback-checkbox-control"
                    labelClassName="feedback-checkbox-label"
                  >
                    {isAuthenticated
                      ? "Use my account email for a reply"
                      : "You may contact me about this feedback"}
                  </AppCheckbox>
                  <p id="feedback-contact-helper" className="feedback-checkbox-helper">
                    We’ll only use your email to follow up about this message.
                  </p>
                  {allowContact && !isAuthenticated ? (
                    <AppTextField
                      isRequired
                      type="email"
                      autoComplete="email"
                      label="Email for a reply"
                      placeholder="you@example.com"
                      value={contactEmail}
                      onChangeValue={setContactEmail}
                      isInvalid={emailInvalid}
                      errorMessage={emailInvalid ? "Enter a valid email address." : undefined}
                      classes={{
                        label: "feedback-field-label",
                        input: "feedback-message-input",
                        inputWrapper:
                          "feedback-field-wrapper border-[#E0B15C]/32 bg-[#22130F]",
                        error: "feedback-error-message",
                      }}
                    />
                  ) : null}
                </div>

                <div className="feedback-consent-group">
                  <AppCheckbox
                    selected={includeDiagnostics}
                    aria-describedby="feedback-diagnostics-helper feedback-diagnostics-reassurance"
                    onChange={(selected) => {
                      setIncludeDiagnostics(selected);
                      setDiagnosticsTouched(true);
                    }}
                    className="feedback-checkbox min-h-11"
                    controlClassName="feedback-checkbox-control"
                    labelClassName="feedback-checkbox-label"
                  >
                    Include technical details
                  </AppCheckbox>
                  <p
                    id="feedback-diagnostics-helper"
                    className="feedback-checkbox-helper"
                  >
                    Current page, browser, screen size, app version, and timestamp.
                  </p>
                  <p
                    id="feedback-diagnostics-reassurance"
                    className="feedback-checkbox-reassurance"
                  >
                    Never includes passwords, cookies, or private invite links.
                  </p>
                </div>

                <input
                  className="feedback-honeypot"
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                />

                <p className="feedback-privacy-note">
                  Don’t include passwords or private invite links.
                </p>
                {mutation.isError ? (
                  <p className="feedback-error-message" role="alert">
                    {getErrorMessage(mutation.error)}
                  </p>
                ) : null}
                {mutation.isPending ? (
                  <p className="sr-only" role="status" aria-live="polite">
                    Sending feedback
                  </p>
                ) : null}
              </AppModalBody>
              <AppModalFooter className="feedback-dialog-footer flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="app-secondary-button w-full sm:w-auto"
                  size="md"
                  onPress={onClose}
                  isDisabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="feedback-submit-button app-primary-button w-full sm:w-auto"
                  size="md"
                  isPending={mutation.isPending}
                  isDisabled={mutation.isPending}
                >
                  {mutation.isPending ? "Sending…" : "Send feedback"}
                </Button>
              </AppModalFooter>
            </form>
          )
        }
    </AppModal>
  );
}
