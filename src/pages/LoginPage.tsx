import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { requestMagicLink } from "../features/auth/auth.api";
import { subscribeToAuthSuccess } from "../features/auth/authHandoff";
import SkipLink from "../components/SkipLink";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_oauth_failed: "Google sign-in failed. Please try again.",
  google_email_required:
    "Google did not provide an email address. Try another sign-in method.",
  magic_link_invalid: "That magic link is invalid. Request a new one.",
  magic_link_expired: "That magic link expired. Request a new one.",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  const googleLoginUrl = (
    import.meta.env.VITE_OAUTH_GOOGLE_LOGIN_URL as string | undefined
  )?.trim();
  const oauthErrorCode = searchParams.get("oauth_error");
  const oauthErrorMessage = oauthErrorCode
    ? (OAUTH_ERROR_MESSAGES[oauthErrorCode] ??
      "Social sign-in failed. Please try again.")
    : null;
  const inputClassNames = {
    label: "!text-[#F5D9A5]",
    input: "!text-[#F7F1E3] placeholder:text-[#D9C7A8]/70",
    inputWrapper:
      "border-[#E0B15C]/30 bg-[#1C110F] data-[hover=true]:border-[#E0B15C]/50 data-[focus=true]:border-[#F2C16E]",
  };

  const magicLinkMutation = useMutation({ mutationFn: requestMagicLink });
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
    if (!normalizedEmail) return;
    magicLinkMutation.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setMagicSentTo(normalizedEmail);
        },
      },
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#140C0A] text-[#F7F1E3]">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12"
      >
        <Card className="w-full border border-[#E0B15C]/25 bg-[#22130F] shadow-none">
          <CardHeader className="px-6 pt-6">
            <h1 className="text-3xl font-semibold text-[#F5D9A5]">Login</h1>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                type="email"
                label="Email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                isRequired
                variant="bordered"
                classNames={inputClassNames}
              />
              {magicLinkMutation.isError ? (
                <p className="text-sm text-[#D77B69]" role="alert">
                  {magicLinkErrorDetail ||
                    "Unable to send magic link right now."}
                </p>
              ) : null}
              {oauthErrorMessage ? (
                <p className="text-sm text-[#D77B69]" role="alert">
                  {oauthErrorMessage}
                </p>
              ) : null}
              {magicSentTo ? (
                <p
                  className="text-sm text-[#D9C7A8]"
                  role="status"
                  aria-live="polite"
                >
                  Check your email to enter Arbiter.
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full border border-[#E0B15C]/50 bg-[#E0B15C] text-[#1C110F]"
                isLoading={magicLinkMutation.isPending}
              >
                Send Magic Link
              </Button>

              {googleLoginUrl ? (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-[#E0B15C]/20" />
                    <span className="text-xs uppercase tracking-wide text-[#D9C7A8]">
                      or
                    </span>
                    <span className="h-px flex-1 bg-[#E0B15C]/20" />
                  </div>
                  {googleLoginUrl ? (
                    <Button
                      type="button"
                      variant="bordered"
                      className="w-full border-[#E0B15C]/45 text-[#E0B15C] hover:bg-[#E0B15C]/10"
                      onPress={() => window.location.assign(googleLoginUrl)}
                    >
                      Continue with Google
                    </Button>
                  ) : null}
                </>
              ) : null}
            </form>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
