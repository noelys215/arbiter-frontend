import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useId, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  localAuthBypass,
  requestMagicLink,
} from "../features/auth/auth.api";
import { subscribeToAuthSuccess } from "../features/auth/authHandoff";
import SkipLink from "../components/SkipLink";
import { AppTextField } from "../components/ui/AppField";
import { API_BASE, IS_LOCAL_DEV } from "../lib/api";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_oauth_failed: "Google sign-in failed. Please try again.",
  google_email_required:
    "Google did not provide an email address. Try another sign-in method.",
  magic_link_invalid: "That magic link is invalid. Request a new one.",
  magic_link_expired: "That magic link expired. Request a new one.",
};

type LocalBypassAccount = {
  key: string;
  label: string;
  token: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const emailHelpId = useId();
  const emailErrorId = useId();
  const statusId = useId();
  const [email, setEmail] = useState("");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const configuredGoogleLoginUrl = (
    import.meta.env.VITE_OAUTH_GOOGLE_LOGIN_URL as string | undefined
  )?.trim();
  const configuredGoogleLoginUrlIsLocal =
    configuredGoogleLoginUrl?.startsWith("http://localhost") ||
    configuredGoogleLoginUrl?.startsWith("http://127.0.0.1");
  const baseGoogleLoginUrl = IS_LOCAL_DEV
    ? `${API_BASE}/auth/google/login`
    : configuredGoogleLoginUrl &&
        configuredGoogleLoginUrl.length > 0 &&
        !configuredGoogleLoginUrlIsLocal
      ? configuredGoogleLoginUrl
      : `${API_BASE}/auth/google/login`;
  const googleLoginUrl = baseGoogleLoginUrl;
  const localAuthBypassToken = (
    import.meta.env.VITE_LOCAL_AUTH_BYPASS_TOKEN as string | undefined
  )?.trim();
  const localAuthBypassSecondaryToken = (
    import.meta.env.VITE_LOCAL_AUTH_BYPASS_SECONDARY_TOKEN as string | undefined
  )?.trim();
  const localBypassAccounts: LocalBypassAccount[] = import.meta.env.DEV
    ? [
        localAuthBypassToken
          ? {
              key: "primary",
              label:
                (import.meta.env.VITE_LOCAL_AUTH_BYPASS_LABEL as string | undefined)
                  ?.trim() || "Use test account A",
              token: localAuthBypassToken,
            }
          : null,
        localAuthBypassSecondaryToken
          ? {
              key: "secondary",
              label:
                (
                  import.meta.env
                    .VITE_LOCAL_AUTH_BYPASS_SECONDARY_LABEL as string | undefined
                )?.trim() || "Use test account B",
              token: localAuthBypassSecondaryToken,
            }
          : null,
      ].filter((account): account is LocalBypassAccount => account !== null)
    : [];
  const oauthErrorCode = searchParams.get("oauth_error");
  const oauthErrorMessage = oauthErrorCode
    ? (OAUTH_ERROR_MESSAGES[oauthErrorCode] ??
      "Social sign-in failed. Please try again.")
    : null;
  const inputClassNames = {
    base: "login-field",
    label: "login-field-label",
    input: "login-field-input",
    inputWrapper:
      "login-field-wrapper aria-[invalid=true]:!border-[#D77B69]/80 focus:!border-[#F2C16E]",
  };

  const magicLinkMutation = useMutation({ mutationFn: requestMagicLink });
  const localAuthBypassMutation = useMutation({ mutationFn: localAuthBypass });
  const magicLinkErrorDetail =
    magicLinkMutation.error &&
    typeof magicLinkMutation.error === "object" &&
    "detail" in magicLinkMutation.error &&
    typeof (magicLinkMutation.error as { detail?: unknown }).detail === "string"
      ? (magicLinkMutation.error as { detail?: string }).detail
      : null;

  useEffect(() => {
    if (!magicSentTo) return;
    const unsubscribe = subscribeToAuthSuccess(() => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void navigate("/app", { replace: true });
    });
    return unsubscribe;
  }, [magicSentTo, navigate, queryClient]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!event.currentTarget.checkValidity()) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    magicLinkMutation.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setMagicSentTo(normalizedEmail);
        },
      },
    );
  };

  const handleLocalAuthBypass = (token: string) => {
    localAuthBypassMutation.mutate(
      { token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["me"] });
          void navigate("/app", { replace: true });
        },
      },
    );
  };

  const isAuthActionPending =
    magicLinkMutation.isPending ||
    isGoogleRedirecting ||
    localAuthBypassMutation.isPending;

  return (
    <div className="login-page">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="login-main"
      >
        <section className="login-intro" aria-labelledby="login-title">
          <Link to="/" className="login-brand" aria-label="Arbiter home">
            <img src="/arbiter.png" alt="" aria-hidden="true" />
            <span>Arbiter</span>
          </Link>
          <div className="login-copy">
            <p className="landing-eyebrow">Ready when you are</p>
            <h1 id="login-title" className="login-title">
              Pick up where movie night begins.
            </h1>
            <p className="login-body">
              Sign in to create a list, invite your group, and find the
              favorite.
            </p>
          </div>
        </section>

        <section className="login-panel" aria-label="Sign in to Arbiter">
          <div className="login-panel-header">
            <h2>Sign in</h2>
            <p>Choose how you’d like to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field-block">
              <AppTextField
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                onInvalid={(event) => {
                  setEmailError(
                    event.currentTarget.validity.valueMissing
                      ? "Enter your email address."
                      : "Enter a valid email address.",
                  );
                }}
                autoComplete="email"
                inputMode="email"
                isRequired
                isInvalid={Boolean(emailError)}
                aria-describedby={`${emailHelpId} ${emailErrorId} ${statusId}`}
                classes={inputClassNames}
              />
              <p id={emailHelpId} className="login-help-text">
                We’ll email you a secure sign-in link. No password needed.
              </p>
              <p
                id={emailErrorId}
                className="login-field-error"
                role={emailError ? "alert" : undefined}
              >
                {emailError}
              </p>
            </div>

            <Button
              type="submit"
              className="login-primary-button"
              isPending={magicLinkMutation.isPending}
              isDisabled={isAuthActionPending}
            >
              Continue with email
            </Button>

            {googleLoginUrl ? (
              <>
                <div className="login-divider" aria-hidden="true">
                  <span />
                  <span>or</span>
                  <span />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="login-secondary-button"
                  isPending={isGoogleRedirecting}
                  isDisabled={isAuthActionPending}
                  onPress={() => {
                    setIsGoogleRedirecting(true);
                    window.location.assign(googleLoginUrl);
                  }}
                >
                  Continue with Google
                </Button>
              </>
            ) : null}

            {localBypassAccounts.length > 0 ? (
              <div className="login-dev-actions" aria-label="Local test accounts">
                {localBypassAccounts.map((account) => (
                  <Button
                    key={account.key}
                    type="button"
                    variant="tertiary"
                    className="login-dev-button"
                    isPending={localAuthBypassMutation.isPending}
                    isDisabled={isAuthActionPending}
                    onPress={() => handleLocalAuthBypass(account.token)}
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
            ) : null}

            <div
              id={statusId}
              className="login-status"
              aria-live="polite"
              aria-atomic="true"
            >
              {magicLinkMutation.isError ? (
                <p className="login-message login-message-error" role="alert">
                  {magicLinkErrorDetail ||
                    "We couldn’t send the link. Please try again."}
                </p>
              ) : null}
              {oauthErrorMessage ? (
                <p className="login-message login-message-error" role="alert">
                  {oauthErrorMessage}
                </p>
              ) : null}
              {localAuthBypassMutation.isError ? (
                <p className="login-message login-message-error" role="alert">
                  Local test sign-in failed. Check your bypass environment.
                </p>
              ) : null}
              {magicSentTo ? (
                <p
                  className="login-message login-message-success"
                  role="status"
                  aria-live="polite"
                >
                  <strong>Check your inbox.</strong> We sent a secure sign-in
                  link to {magicSentTo}.
                </p>
              ) : null}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
