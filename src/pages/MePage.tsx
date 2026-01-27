import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Spinner,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

type UserPayload = {
  id?: string | null;
  email?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
} | null;

export default function MePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserPayload>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiFetch(
          "/me",
          { method: "GET" },
          controller.signal,
        );
        if (!response.ok) {
          if (response.status === 401) {
            setError("No active session. Please sign in.");
            return;
          }
          setError("Unable to load user profile.");
          return;
        }
        const payload = (await response.json()) as UserPayload;
        console.log(payload);
        setError(null);
        setUser(payload);
      } catch {
        setError("Unable to reach the API. Is it running?");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors; still return to login for safety.
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-4xl items-start px-6 py-12">
        <div className="w-full space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60">
                Authenticated
              </p>
              <h1 className="text-3xl font-semibold">Your account</h1>
              <p className="text-sm text-black/60">
                Profile details from {"/me"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="bordered" onPress={() => navigate("/login")}>
                Back to login
              </Button>
              <Button
                className="bg-black text-white"
                onPress={handleLogout}
                isLoading={isLoggingOut}
              >
                Log out
              </Button>
            </div>
          </header>

          <Card className="border border-black/10 bg-white shadow-none">
            <CardHeader className="flex items-center justify-between px-6 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-black">User payload</p>
                <p className="text-xs text-black/60">
                  GET {"/me"} (credentials included)
                </p>
              </div>
              {isLoading ? (
                <Chip variant="bordered">Loading</Chip>
              ) : error ? (
                <Chip variant="bordered">Error</Chip>
              ) : (
                <Chip variant="bordered">OK</Chip>
              )}
            </CardHeader>
            <Divider className="bg-black/10" />
            <CardBody className="px-6 py-6">
              {isLoading ? (
                <div className="flex items-center gap-3 text-black/70">
                  <Spinner size="sm" color="default" />
                  Fetching the latest profile…
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <p className="text-sm text-black/70">{error}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-black text-white"
                      onPress={() => navigate("/login")}
                    >
                      Sign in
                    </Button>
                    <Button variant="bordered" onPress={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : user ? (
                <div className="space-y-4">
                  <ul className="divide-y divide-black/10 rounded-2xl border border-black/10">
                    {Object.entries(user).map(([key, value]) => (
                      <li key={key} className="flex flex-wrap gap-3 px-4 py-3">
                        <span className="min-w-[140px] text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                          {key}
                        </span>
                        <span className="text-sm text-black">
                          {value === null || value === undefined
                            ? "—"
                            : String(value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-black/70">
                  No user data returned.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
