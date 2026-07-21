import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import ArbiterAvatar from "../../components/ArbiterAvatar";
import BrandLockup from "../../components/BrandLockup";
import SkipLink from "../../components/SkipLink";
import { getMe } from "../../features/auth/auth.api";

type MovieNightsShellProps = {
  children: ReactNode;
};

export default function MovieNightsShell({ children }: MovieNightsShellProps) {
  const navigate = useNavigate();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <div className="min-h-screen bg-[#140C0A] text-[#F7EAD2]">
      <SkipLink />
      <nav
        aria-label="Primary"
        className="sticky top-0 z-50 border-b border-[#E0B15C]/12 bg-[#100806]/88 px-4 py-3 backdrop-blur-sm sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Button
            variant="tertiary"
            className="h-auto min-w-0 !bg-transparent p-0 data-[hovered=true]:!bg-transparent"
            onPress={() => navigate("/app")}
            aria-label="Back to Arbiter watchlist"
          >
            <BrandLockup
              titleAs="span"
              logoClassName="h-10 w-10 sm:h-14 sm:w-14"
              titleClassName="text-3xl sm:text-4xl"
              versionClassName="sr-only"
            />
          </Button>
          <Button
            isIconOnly
            variant="tertiary"
            className="h-12 w-12 min-w-12 rounded-full border border-[#E0B15C]/20 !bg-transparent p-0 transition hover:border-[#E0B15C]/55 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] sm:h-14 sm:w-14 sm:min-w-14"
            onPress={() => navigate("/app")}
            aria-label="Return to account and watchlist"
          >
            <ArbiterAvatar
              user={me}
              size="lg"
              className="bg-[#E0B15C] text-[#1C110F]"
              decorative
            />
          </Button>
        </div>
      </nav>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
