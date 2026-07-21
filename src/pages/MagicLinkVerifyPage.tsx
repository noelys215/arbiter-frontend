import { Spinner } from "@heroui/react";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SkipLink from "../components/SkipLink";
import { API_BASE } from "../lib/api";

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  useEffect(() => {
    if (!token) return;
    const destination = new URL("/auth/magic-link/verify", API_BASE);
    destination.searchParams.set("token", token);
    window.location.replace(destination.toString());
  }, [token]);

  return (
    <div className="min-h-screen bg-[#140C0A] text-[#F7F1E3]">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12"
      >
        <div className="w-full border border-[#E0B15C]/25 bg-[#22130F] p-6">
          {token ? (
            <div className="flex items-center gap-3 text-[#F5D9A5]" role="status">
              <Spinner color="current" size="sm" />
              <p>Signing you in...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-[#F5D9A5]">
                Magic link missing
              </h1>
              <p className="text-sm leading-6 text-[#D9C7A8]">
                This sign-in link is missing its token. Request a new magic link
                to enter Arbiter.
              </p>
              <Link className="font-semibold text-[#F5D9A5] underline" to="/login">
                Back to login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
