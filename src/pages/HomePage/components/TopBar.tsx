import { Avatar, Button, Select, SelectItem, Tooltip } from "@heroui/react";
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
    <nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between border-b border-[#D4AF37]/20 bg-[#070707]/95 px-6 py-3 backdrop-blur-sm">
      {/* Left: Logo */}
      <div className="flex items-center">
        <img
          src="/arbiter.png"
          alt="Arbiter"
          className="h-34 w-34 rounded-sm object-contain"
        />
        <h1 className="text-6xl font-semibold text-[#D4AF37]">Arbiter</h1>
      </div>

      {/* Center: Group Dropdown */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <Select
          aria-label="Group"
          placeholder="Select a group"
          selectedKeys={selectedGroupId ? [selectedGroupId] : []}
          renderValue={(items) =>
            items.map((item) => (
              <span key={item.key} className="text-[#D4AF37]">
                {item.textValue}
              </span>
            ))
          }
          onSelectionChange={(keys) => {
            const [value] = Array.from(keys);
            if (typeof value === "string") {
              onSelectGroup(value);
            }
          }}
          isDisabled={!groups || groups.length === 0}
          size="sm"
          variant="bordered"
          className="max-w-xs min-w-55"
          classNames={{
            trigger:
              "border-[#D4AF37]/30 bg-[#0F0F10] text-[#D4AF37] data-[focus=true]:border-[#D4AF37] data-[focus=true]:ring-1 data-[focus=true]:ring-[#D4AF37]/50",
            value: "!text-[#D4AF37] data-[placeholder=true]:text-[#D4AF37]/70",
            listbox: "bg-[#0F0F10] text-[#D4AF37]",
            popoverContent: "bg-[#0F0F10] border border-[#D4AF37]/20",
            selectorIcon: "text-[#D4AF37]/70",
          }}
        >
          {(groups ?? []).map((group) => (
            <SelectItem key={group.id}>{group.name}</SelectItem>
          ))}
        </Select>
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
