import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Textarea,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type FormEvent, type RefObject } from "react";
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
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      size="xl"
      scrollBehavior="inside"
      isDismissable={!mutation.isPending}
      isKeyboardDismissDisabled={mutation.isPending}
      classNames={{
        base: "feedback-dialog max-h-[calc(100dvh-1.5rem)] !max-w-[44rem] border border-[#E0B15C]/20 bg-[#1C110F]",
        wrapper: "items-end pb-4 sm:items-center sm:pb-0",
        backdrop: "bg-black/38",
        closeButton:
          "feedback-close-button min-h-11 min-w-11 text-[#EAD9BC] hover:bg-[#E0B15C]/10 hover:text-[#F7EAD2]",
        header: "feedback-dialog-header",
        body: "feedback-dialog-body",
        footer: "feedback-dialog-footer",
      }}
    >
      <ModalContent>
        {(onClose) =>
          mutation.isSuccess ? (
            <>
              <ModalHeader className="sr-only">Feedback sent</ModalHeader>
              <ModalBody className="feedback-success py-10 sm:py-14">
                <p className="landing-eyebrow">Thank you</p>
                <h2
                  ref={successHeadingRef}
                  tabIndex={-1}
                  className="app-heading-serif text-3xl text-[#F7EAD2] sm:text-4xl"
                >
                  Thanks for helping improve Arbiter.
                </h2>
                <p className="app-text-secondary">Your feedback has been sent.</p>
                {sentWithContact ? (
                  <p className="text-sm app-text-metadata">
                    We may follow up at the email you provided.
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button className="app-primary-button" size="lg" onPress={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="contents" noValidate>
              <ModalHeader className="flex flex-col items-start gap-0.5">
                <h2 className="app-heading-serif text-3xl text-[#F7EAD2]">
                  Share feedback
                </h2>
                <p className="text-sm font-normal app-text-secondary">
                  Help make Arbiter better.
                </p>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <RadioGroup
                  label="What would you like to send?"
                  value={type}
                  onValueChange={handleTypeChange}
                  orientation="horizontal"
                  classNames={{
                    label: "text-sm font-semibold text-[#F7EAD2]",
                    wrapper: "feedback-type-options",
                  }}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <Radio
                      key={option.value}
                      value={option.value}
                      classNames={{
                        base: "feedback-type-option",
                        label: "feedback-type-label",
                        wrapper: "feedback-type-radio",
                        control:
                          "feedback-type-indicator border-[#E0B15C]/48 group-data-[selected=true]:border-[#E0B15C] group-data-[selected=true]:bg-[#E0B15C]",
                      }}
                    >
                      {option.label}
                    </Radio>
                  ))}
                </RadioGroup>

                <Textarea
                  isRequired
                  label={MESSAGE_LABELS[type]}
                  placeholder={MESSAGE_PLACEHOLDERS[type]}
                  value={message}
                  onValueChange={setMessage}
                  minRows={3}
                  maxRows={7}
                  maxLength={4000}
                  variant="bordered"
                  isInvalid={messageInvalid}
                  errorMessage={
                    messageInvalid ? (
                      <span role="alert">Please add a little more detail.</span>
                    ) : undefined
                  }
                  description={`${message.length.toLocaleString()} / 4,000`}
                  classNames={{
                    label: "feedback-field-label",
                    input: "feedback-message-input text-base",
                    inputWrapper:
                      "feedback-field-wrapper border-[#E0B15C]/32 bg-[#22130F]",
                    description: "feedback-character-count",
                    errorMessage: "feedback-error-message",
                  }}
                />

                <div className="feedback-consent-group">
                  <Checkbox
                    isSelected={allowContact}
                    onValueChange={setAllowContact}
                    aria-describedby="feedback-contact-helper"
                    classNames={{
                      base: "feedback-checkbox min-h-11",
                      wrapper: "feedback-checkbox-control",
                      label: "feedback-checkbox-label",
                    }}
                  >
                    {isAuthenticated
                      ? "Use my account email for a reply"
                      : "You may contact me about this feedback"}
                  </Checkbox>
                  <p id="feedback-contact-helper" className="feedback-checkbox-helper">
                    We’ll only use your email to follow up about this message.
                  </p>
                  {allowContact && !isAuthenticated ? (
                    <Input
                      isRequired
                      type="email"
                      autoComplete="email"
                      label="Email for a reply"
                      placeholder="you@example.com"
                      value={contactEmail}
                      onValueChange={setContactEmail}
                      variant="bordered"
                      isInvalid={emailInvalid}
                      errorMessage={
                        emailInvalid ? (
                          <span role="alert">Enter a valid email address.</span>
                        ) : undefined
                      }
                      classNames={{
                        label: "feedback-field-label",
                        input: "feedback-message-input",
                        inputWrapper:
                          "feedback-field-wrapper border-[#E0B15C]/32 bg-[#22130F]",
                        errorMessage: "feedback-error-message",
                      }}
                    />
                  ) : null}
                </div>

                <div className="feedback-consent-group">
                  <Checkbox
                    isSelected={includeDiagnostics}
                    aria-describedby="feedback-diagnostics-helper feedback-diagnostics-reassurance"
                    onValueChange={(selected) => {
                      setIncludeDiagnostics(selected);
                      setDiagnosticsTouched(true);
                    }}
                    classNames={{
                      base: "feedback-checkbox min-h-11",
                      wrapper: "feedback-checkbox-control",
                      label: "feedback-checkbox-label",
                    }}
                  >
                    Include technical details
                  </Checkbox>
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
              </ModalBody>
              <ModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="light"
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
                  isLoading={mutation.isPending}
                  isDisabled={mutation.isPending}
                >
                  {mutation.isPending ? "Sending…" : "Send feedback"}
                </Button>
              </ModalFooter>
            </form>
          )
        }
      </ModalContent>
    </Modal>
  );
}
