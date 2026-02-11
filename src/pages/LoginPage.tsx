import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../features/auth/auth.api";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_oauth_failed: "Google sign-in failed. Please try again.",
  google_email_required:
    "Google did not provide an email address. Try another sign-in method.",
  facebook_oauth_failed: "Facebook sign-in failed. Please try again.",
  facebook_profile_failed:
    "Facebook profile data could not be loaded. Please try again.",
  facebook_email_required:
    "Facebook did not provide an email address. Try another sign-in method.",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleLoginUrl = (
    import.meta.env.VITE_OAUTH_GOOGLE_LOGIN_URL as string | undefined
  )?.trim();
  const facebookLoginUrl = (
    import.meta.env.VITE_OAUTH_FACEBOOK_LOGIN_URL as string | undefined
  )?.trim();
  const oauthErrorCode = searchParams.get("oauth_error");
  const oauthErrorMessage = oauthErrorCode
    ? OAUTH_ERROR_MESSAGES[oauthErrorCode] ??
      "Social sign-in failed. Please try again."
    : null;

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/app", { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Card className="w-full border border-black/10 bg-white shadow-none">
          <CardHeader className="px-6 pt-6">
            <h1 className="text-2xl font-semibold">Login</h1>
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
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                isRequired
                variant="bordered"
              />
              {loginMutation.isError ? (
                <p className="text-sm text-red-600">
                  Unable to login. Check your credentials.
                </p>
              ) : null}
              {oauthErrorMessage ? (
                <p className="text-sm text-red-600">{oauthErrorMessage}</p>
              ) : null}
              <Button
                type="submit"
                className="w-full bg-black text-white"
                isLoading={loginMutation.isPending}
              >
                Sign in
              </Button>

              {googleLoginUrl || facebookLoginUrl ? (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-black/15" />
                    <span className="text-xs uppercase tracking-wide text-black/50">
                      or
                    </span>
                    <span className="h-px flex-1 bg-black/15" />
                  </div>
                  {googleLoginUrl ? (
                    <Button
                      type="button"
                      variant="bordered"
                      className="w-full"
                      onPress={() => window.location.assign(googleLoginUrl)}
                    >
                      Continue with Google
                    </Button>
                  ) : null}
                  {facebookLoginUrl ? (
                    <Button
                      type="button"
                      variant="bordered"
                      className="w-full"
                      onPress={() => window.location.assign(facebookLoginUrl)}
                    >
                      Continue with Facebook
                    </Button>
                  ) : null}
                </>
              ) : null}
            </form>
            <p className="mt-4 text-sm text-black/70">
              Need an account?{" "}
              <Link className="font-semibold text-black" to="/register">
                Register
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
