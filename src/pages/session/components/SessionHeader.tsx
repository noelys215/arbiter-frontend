import { Avatar, Button, Select, SelectItem, Tooltip } from "@heroui/react";
import BrandLockup from "../../../components/BrandLockup";
import type { Group } from "../../../features/groups/groups.api";
import { theaterSelectClassNames } from "../../../lib/selectTheme";

type SessionHeaderProps = {
  groups: Group[];
  resolvedGroupId: string | null;
  onSelectGroupId: (groupId: string) => void;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  isGroupLeader: boolean;
  activeSessionId: string | null;
  isEndingSession: boolean;
  onEndSession: () => void;
  onGoHome: () => void;
};

export default function SessionHeader({
  groups,
  resolvedGroupId,
  onSelectGroupId,
  userName,
  userEmail,
  userAvatarUrl,
  isGroupLeader,
  activeSessionId,
  isEndingSession,
  onEndSession,
  onGoHome,
}: SessionHeaderProps) {
  const groupLabelId = "session-header-group-label";

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
            {isGroupLeader && activeSessionId ? (
              <Button
                size="sm"
                variant="bordered"
                className="border-[#D77B69]/45 px-3 text-[#F1A799] sm:px-6"
                isLoading={isEndingSession}
                onPress={onEndSession}
              >
                End Session
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
                <Avatar
                  size="lg"
                  src={userAvatarUrl ?? undefined}
                  name={userName}
                  className="h-12 w-12 bg-[#E0B15C] text-[#1C110F]"
                />
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <span
            id={groupLabelId}
            className="text-sm font-medium text-[#D9C7A8]"
          >
            Group:
          </span>
          <Select
            size="sm"
            aria-labelledby={groupLabelId}
            selectedKeys={resolvedGroupId ? [resolvedGroupId] : []}
            onSelectionChange={(keys) => {
              const [value] = Array.from(keys);
              if (typeof value === "string") {
                onSelectGroupId(value);
              }
            }}
            className="max-w-40 min-w-40 sm:max-w-44 sm:min-w-44"
            classNames={theaterSelectClassNames}
          >
            {groups.map((group) => (
              <SelectItem key={group.id}>{group.name}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </header>
  );
}
