import { Avatar, Button, Tooltip } from "@heroui/react";
import type { MeResponse } from "../../../features/auth/auth.api";
import type { Group } from "../../../features/groups/groups.api";

type TopBarProps = {
  groups: Group[] | undefined;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  me: MeResponse | undefined;
  onAvatarClick: () => void;
};

export default function TopBar({
  groups,
  selectedGroupId,
  onSelectGroup,
  me,
  onAvatarClick,
}: TopBarProps) {
  console.log(groups);
  return (
    <nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-[#D4AF37]/20 bg-[#070707]/95 px-6 py-3 backdrop-blur-sm">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <img
          src="/arbiter.png"
          alt="Arbiter"
          className="h-12 w-12 rounded-sm object-contain"
        />
        <span className="text-xl font-semibold text-[#D4AF37]">Arbiter</span>
      </div>

      {/* Center: Group Dropdown */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <label className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
          Group
        </label>
        <select
          className="min-w-[220px] rounded-md border border-[#D4AF37]/30 bg-[#0F0F10] px-3 py-2 text-sm text-white transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
          value={selectedGroupId ?? ""}
          onChange={(event) => onSelectGroup(event.target.value)}
          disabled={!groups || groups.length === 0}
        >
          {(groups ?? []).map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right text-xs">
          <p className="font-semibold text-white">
            {me?.display_name ?? me?.username ?? "User"}
          </p>
          <p className="text-[#A0A0A0]">{me?.email ?? ""}</p>
        </div>
        <Tooltip content="Account settings" placement="bottom">
          <Button
            isIconOnly
            variant="light"
            className="rounded-full border border-[#D4AF37]/30 p-0 transition hover:border-[#D4AF37]"
            onPress={onAvatarClick}
            aria-label="Open account menu"
          >
            <Avatar
              size="sm"
              src={me?.avatar_url ?? undefined}
              name={me?.display_name ?? me?.username ?? "User"}
              className="bg-[#D4AF37] text-black"
            />
          </Button>
        </Tooltip>
      </div>
    </nav>
  );
}
