import { Button, Select, SelectItem } from "@heroui/react";
import type { Group } from "../../../features/groups/groups.api";

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
    <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-[#070707]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-label="Go to home"
          className="flex items-center gap-3 rounded-lg p-1 text-left transition hover:bg-[#D4AF37]/10"
          onClick={onGoHome}
        >
          <img
            src="/arbiter.png"
            alt="Arbiter"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="session-title-micro text-xs text-[#D4AF37]/80">
              Tonight Session
            </p>
            <h1 className="text-lg text-[#D4AF37]">Arbiter</h1>
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
            classNames={{
              trigger:
                "border-[#D4AF37]/25 bg-[#0F0F10] text-[#D4AF37] data-[focus=true]:border-[#D4AF37]",
              value: "!text-[#D4AF37]",
              popoverContent: "border border-[#D4AF37]/20 bg-[#0F0F10]",
              selectorIcon: "text-[#D4AF37]/80",
            }}
          >
            {groups.map((group) => (
              <SelectItem key={group.id}>{group.name}</SelectItem>
            ))}
          </Select>

          <div className="hidden text-right text-xs text-[#A0A0A0] sm:block">
            <p className="text-white">{userName}</p>
            <p>{userEmail}</p>
          </div>

          {isGroupLeader && activeSessionId ? (
            <Button
              size="sm"
              variant="bordered"
              className="border-[#7B1E2B]/45 px-8 text-[#E0919B]"
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
