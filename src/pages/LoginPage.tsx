import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../features/auth/auth.api";

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
              <Button
                type="submit"
                className="w-full bg-black text-white"
                isLoading={loginMutation.isPending}
              >
                Sign in
              </Button>
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
