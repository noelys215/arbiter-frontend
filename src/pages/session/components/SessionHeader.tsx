import { Button, Tooltip } from "@heroui/react";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import BrandLockup from "../../../components/BrandLockup";
import type { AvatarUser } from "../../../features/avatar/avatarTypes";

type SessionHeaderProps = {
  selectedGroupName: string;
  user: AvatarUser | null | undefined;
  userName: string;
  userEmail: string;
  isGroupLeader: boolean;
  activeSessionId: string | null;
  isEndingSession: boolean;
  onEndSession: () => void;
  onLeaveSession: () => void;
  onGoHome: () => void;
};

export default function SessionHeader({
  selectedGroupName,
  user,
  userName,
  userEmail,
  isGroupLeader,
  activeSessionId,
  isEndingSession,
  onEndSession,
  onLeaveSession,
  onGoHome,
}: SessionHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-[#E0B15C]/20 bg-[#140C0A]/95 backdrop-blur-sm"
      aria-label="Session controls"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Go to home"
            className="flex items-center rounded-lg p-1 text-left transition hover:bg-[#E0B15C]/10"
            onClick={onGoHome}
          >
            <BrandLockup />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeSessionId ? (
              <Button
                size="sm"
                variant="bordered"
                className="border-[#D77B69]/45 px-3 text-[#F1A799] sm:px-6"
                isLoading={isGroupLeader ? isEndingSession : false}
                onPress={isGroupLeader ? onEndSession : onLeaveSession}
              >
                {isGroupLeader ? "End Session" : "Leave Session"}
              </Button>
            ) : null}

            <Tooltip
              content={`${userName}${userEmail ? `\n${userEmail}` : ""}`}
              placement="bottom"
              classNames={{
                content:
                  "whitespace-pre-line border border-[#E0B15C]/25 bg-[#22130F] text-[#F7F1E3]",
              }}
            >
              <div className="rounded-full border border-[#E0B15C]/30 p-0">
                <ArbiterAvatar
                  user={user}
                  size="lg"
                  label={userName}
                  className="h-12 w-12 bg-[#E0B15C] text-[#1C110F]"
                />
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-medium text-[#A99577]">Group</span>
          <span className="max-w-[16rem] truncate font-semibold text-[#F5D9A5]">
            {selectedGroupName}
          </span>
        </div>
      </div>
    </header>
  );
}
