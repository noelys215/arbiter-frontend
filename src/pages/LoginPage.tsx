import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

type AuthTab = "login" | "register";

type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = {
  email: string;
  username: string;
  display_name: string;
  password: string;
};

const defaultLogin: LoginForm = { email: "", password: "" };
const defaultRegister: RegisterForm = {
  email: "",
  username: "",
  display_name: "",
  password: "",
};

function formatErrorMessage(status: number, fallback: string) {
  if (status === 401) return "Invalid email or password.";
  if (status === 409) return "Account already exists. Try logging in.";
  if (status >= 500) return "Server error. Please try again shortly.";
  return fallback;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loginForm, setLoginForm] = useState<LoginForm>(defaultLogin);
  const [registerForm, setRegisterForm] =
    useState<RegisterForm>(defaultRegister);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const canLogin = useMemo(
    () =>
      loginForm.email.trim().length > 0 && loginForm.password.trim().length > 0,
    [loginForm],
  );

  const canRegister = useMemo(
    () =>
      registerForm.email.trim().length > 0 &&
      registerForm.username.trim().length > 0 &&
      registerForm.display_name.trim().length > 0 &&
      registerForm.password.trim().length > 0,
    [registerForm],
  );

  useEffect(() => {
    const controller = new AbortController();
    const checkSession = async () => {
      try {
        const response = await apiFetch(
          "/me",
          { method: "GET" },
          controller.signal,
        );
        if (response.ok) {
          navigate("/me", { replace: true });
          return;
        }
      } catch {
        // Silent: unauthenticated or server down.
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
    return () => controller.abort();
  }, [navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canLogin || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        setError(formatErrorMessage(response.status, "Login failed."));
        return;
      }

      setLoginForm(defaultLogin);
      navigate("/me", { replace: true });
    } catch {
      setError("Unable to connect. Check that the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRegister || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email.trim(),
          username: registerForm.username.trim(),
          display_name: registerForm.display_name.trim(),
          password: registerForm.password,
        }),
      });

      if (!response.ok) {
        setError(formatErrorMessage(response.status, "Registration failed."));
        return;
      }

      const loginResponse = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email.trim(),
          password: registerForm.password,
        }),
      });

      if (!loginResponse.ok) {
        setError("Registered, but auto-login failed. Please sign in.");
        return;
      }

      setRegisterForm(defaultRegister);
      navigate("/me", { replace: true });
    } catch {
      setError("Unable to connect. Check that the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = () => {
    if (checkingSession) {
      return (
        <Chip color="primary" variant="flat" radius="sm">
          Checking for an active session…
        </Chip>
      );
    }

    if (error) {
      return (
        <Chip color="danger" variant="flat" radius="sm">
          {error}
        </Chip>
      );
    }

    return (
      <Chip color="success" variant="flat" radius="sm">
        Secure cookies enabled — ready to authenticate.
      </Chip>
    );
  };

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Card className="w-full border border-black/10 bg-white shadow-none">
          <CardHeader className="flex flex-col items-start gap-3 px-6 pt-6">
            <h1 className="text-2xl font-semibold">
              {activeTab === "login" ? "Login" : "Register"}
            </h1>
            {renderStatus()}
          </CardHeader>
          <Divider className="bg-black/10" />
          <CardBody className="px-6 py-6">
            <Tabs
              color="primary"
              variant="bordered"
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as AuthTab)}
              classNames={{
                tabList: "border-black/10",
                tab: "data-[selected=true]:bg-black data-[selected=true]:text-white",
              }}
            >
              <Tab key="login" title="Login">
                <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                  <Input
                    type="email"
                    label="Email"
                    placeholder="you@company.com"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    isRequired
                    variant="bordered"
                  />
                  <Input
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    isRequired
                    variant="bordered"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-black text-white"
                    radius="md"
                    isDisabled={!canLogin || isSubmitting || checkingSession}
                    isLoading={isSubmitting}
                  >
                    Sign in
                  </Button>
                </form>
              </Tab>
              <Tab key="register" title="Register">
                <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                  <Input
                    type="email"
                    label="Email"
                    placeholder="you@company.com"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    isRequired
                    variant="bordered"
                  />
                  <Input
                    type="text"
                    label="Username"
                    placeholder="your-handle"
                    value={registerForm.username}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    autoComplete="username"
                    isRequired
                    variant="bordered"
                  />
                  <Input
                    type="text"
                    label="Display name"
                    placeholder="Your name"
                    value={registerForm.display_name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        display_name: event.target.value,
                      }))
                    }
                    autoComplete="name"
                    isRequired
                    variant="bordered"
                  />
                  <Input
                    type="password"
                    label="Password"
                    placeholder="Create a strong password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    isRequired
                    variant="bordered"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-black text-white"
                    radius="md"
                    isDisabled={!canRegister || isSubmitting || checkingSession}
                    isLoading={isSubmitting}
                  >
                    Create account
                  </Button>
                </form>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
