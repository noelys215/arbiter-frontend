import { Tooltip } from "@heroui/react";
import type { ReactNode } from "react";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import BrandLockup from "../../../components/BrandLockup";
import type { AvatarUser } from "../../../features/avatar/avatarTypes";

type SessionHeaderProps = {
  user: AvatarUser | null | undefined;
  userName: string;
  userEmail: string;
  sessionAction: ReactNode;
  onGoHome: () => void;
};

export default function SessionHeader({
  user,
  userName,
  userEmail,
  sessionAction,
  onGoHome,
}: SessionHeaderProps) {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[#E0B15C]/12 bg-[#100806]/88 px-4 py-3 backdrop-blur-sm sm:px-6"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Go to home"
          className="flex items-center rounded-lg text-left transition hover:bg-[#E0B15C]/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E]"
          onClick={onGoHome}
        >
          <BrandLockup
            logoClassName="!h-10 !w-10 sm:!h-20 sm:!w-20"
            titleClassName="text-[1.75rem] sm:text-4xl"
            versionClassName="sr-only"
          />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {sessionAction}
          <Tooltip
            content={`${userName}${userEmail ? `\n${userEmail}` : ""}`}
            placement="bottom"
            classNames={{
              content:
                "whitespace-pre-line border border-[#E0B15C]/25 bg-[#22130F] text-[#F7F1E3]",
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E0B15C]/20 p-0 sm:h-14 sm:w-14">
              <ArbiterAvatar
                user={user}
                size="lg"
                label={userName}
                className="bg-[#E0B15C] text-[#1C110F]"
              />
            </div>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
