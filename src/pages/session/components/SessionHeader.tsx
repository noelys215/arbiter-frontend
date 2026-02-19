import { Button, Select, SelectItem } from "@heroui/react";
import type { Group } from "../../../features/groups/groups.api";
import { theaterSelectClassNames } from "../../../lib/selectTheme";

type SessionHeaderProps = {
  groups: Group[];
  resolvedGroupId: string | null;
  onSelectGroupId: (groupId: string) => void;
  userName: string;
  userEmail: string;
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
  isGroupLeader,
  activeSessionId,
  isEndingSession,
  onEndSession,
  onGoHome,
}: SessionHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E0B15C]/20 bg-[#140C0A]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-label="Go to home"
          className="flex items-center gap-3 rounded-lg p-1 text-left transition hover:bg-[#E0B15C]/10"
          onClick={onGoHome}
        >
          <img
            src="/arbiter.png"
            alt="Arbiter"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="session-title-micro text-xs text-[#E0B15C]/80">
              Tonight Session
            </p>
            <h1 className="text-lg text-[#E0B15C]">Arbiter</h1>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <Select
            size="sm"
            aria-label="Group"
            selectedKeys={resolvedGroupId ? [resolvedGroupId] : []}
            onSelectionChange={(keys) => {
              const [value] = Array.from(keys);
              if (typeof value === "string") {
                onSelectGroupId(value);
              }
            }}
            className="min-w-[180px]"
            classNames={theaterSelectClassNames}
          >
            {groups.map((group) => (
              <SelectItem key={group.id}>{group.name}</SelectItem>
            ))}
          </Select>

          <div className="hidden text-right text-xs text-[#D9C7A8] sm:block">
            <p className="text-white">{userName}</p>
            <p>{userEmail}</p>
          </div>

          {isGroupLeader && activeSessionId ? (
            <Button
              size="sm"
              variant="bordered"
              className="border-[#D77B69]/45 px-8 text-[#F1A799]"
              isLoading={isEndingSession}
              onPress={onEndSession}
            >
              End Session
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
