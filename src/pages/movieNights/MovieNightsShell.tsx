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
        className="border-b border-[#E0B15C]/10 bg-[#140C0A]"
      >
        <div className="mx-auto flex h-[73px] max-w-[88rem] items-center justify-between px-4 sm:h-[105px] sm:px-8">
          <Button
            variant="tertiary"
            className="h-auto min-w-0 !bg-transparent p-0 data-[hovered=true]:!bg-transparent"
            onPress={() => navigate("/app")}
            aria-label="Back to Arbiter watchlist"
          >
            <BrandLockup
              titleAs="span"
              showVersion={false}
              logoClassName="h-12 w-12 sm:h-16 sm:w-16"
              titleClassName="text-3xl text-[#F7EAD2] sm:text-4xl"
            />
          </Button>
          <Button
            isIconOnly
            variant="tertiary"
            className="h-12 w-12 min-w-12 rounded-full !bg-transparent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E]"
            onPress={() => navigate("/app")}
            aria-label="Return to account and watchlist"
          >
            <ArbiterAvatar user={me} size="lg" decorative />
          </Button>
        </div>
      </nav>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
