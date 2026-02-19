import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../features/auth/auth.api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const inputClassNames = {
    label: "text-[#D9C7A8]",
    input: "!text-[#F7F1E3] placeholder:text-[#D9C7A8]/70",
    inputWrapper:
      "border-[#E0B15C]/30 bg-[#1C110F] data-[hover=true]:border-[#E0B15C]/50 data-[focus=true]:border-[#F2C16E]",
  };

  const registerMutation = useMutation({
    mutationFn: register,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/app", { replace: true });
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !username.trim() || !displayName.trim() || !password) {
      return;
    }
    try {
      await registerMutation.mutateAsync({
        email: email.trim(),
        username: username.trim(),
        display_name: displayName.trim(),
        password,
      });
      await loginMutation.mutateAsync({ email: email.trim(), password });
    } catch {
      // handled by error state
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#140C0A] text-[#F7F1E3]">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Card className="w-full border border-[#E0B15C]/25 bg-[#22130F] shadow-none">
          <CardHeader className="px-6 pt-6">
            <h1 className="text-3xl font-semibold text-[#F5D9A5]">Register</h1>
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
              <Input
                type="text"
                label="Username"
                placeholder="your-handle"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                isRequired
                variant="bordered"
                classNames={inputClassNames}
              />
              <Input
                type="text"
                label="Display name"
                placeholder="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                isRequired
                variant="bordered"
                classNames={inputClassNames}
              />
              <Input
                type="password"
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                isRequired
                variant="bordered"
                classNames={inputClassNames}
              />
              {registerMutation.isError || loginMutation.isError ? (
                <p className="text-sm text-[#D77B69]">
                  Unable to register. Please try again.
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full border border-[#E0B15C]/50 bg-[#E0B15C] text-[#1C110F]"
                isLoading={registerMutation.isPending || loginMutation.isPending}
              >
                Create account
              </Button>
            </form>
            <p className="mt-4 text-sm text-[#D9C7A8]">
              Already have an account?{" "}
              <Link className="font-semibold text-[#F5D9A5]" to="/login">
                Login
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
