import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SkipLink from "../components/SkipLink";
import { verifyMagicLink } from "../features/auth/auth.api";
import { broadcastAuthSuccess } from "../features/auth/authHandoff";
import { clearArbiterSessionContextStorage } from "../lib/sessionStorage";

export default function MagicLinkVerifyPage() {
  const [grant] = useState(() => {
    const value = new URLSearchParams(window.location.hash.slice(1))
      .get("grant")
      ?.trim();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    return value ?? "";
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!grant) return;
    let active = true;
    clearArbiterSessionContextStorage(window.localStorage);
    void verifyMagicLink(grant)
      .then(() => {
        if (!active) return;
        broadcastAuthSuccess("magic-link");
        window.location.replace("/app?auth=magic-link");
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [grant]);

  return (
    <div className="min-h-screen bg-[#140C0A] text-[#F7F1E3]">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12"
      >
        <div className="w-full border border-[#E0B15C]/25 bg-[#22130F] p-6">
          {grant && !failed ? (
            <div className="flex items-center gap-3 text-[#F5D9A5]" role="status">
              <Spinner color="current" size="sm" />
              <p>Signing you in...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-[#F5D9A5]">
                {failed ? "This link cannot be used" : "Magic link missing"}
              </h1>
              <p className="text-sm leading-6 text-[#D9C7A8]">
                {failed
                  ? "The link may have expired or already been used. Request a new magic link to enter Arbiter."
                  : "This sign-in link is incomplete. Request a new magic link to enter Arbiter."}
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
