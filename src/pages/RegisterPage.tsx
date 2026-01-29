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
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Card className="w-full border border-black/10 bg-white shadow-none">
          <CardHeader className="px-6 pt-6">
            <h1 className="text-2xl font-semibold">Register</h1>
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
                type="text"
                label="Username"
                placeholder="your-handle"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                isRequired
                variant="bordered"
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
              />
              {registerMutation.isError || loginMutation.isError ? (
                <p className="text-sm text-red-600">
                  Unable to register. Please try again.
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full bg-black text-white"
                isLoading={registerMutation.isPending || loginMutation.isPending}
              >
                Create account
              </Button>
            </form>
            <p className="mt-4 text-sm text-black/70">
              Already have an account?{" "}
              <Link className="font-semibold text-black" to="/login">
                Login
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
