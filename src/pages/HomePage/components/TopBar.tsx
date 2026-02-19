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
    <nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between border-b border-[#E0B15C]/20 bg-[#140C0A]/95 px-6 py-3 backdrop-blur-sm">
      {/* Left: Logo */}
      <div className="flex items-center">
        <img
          src="/arbiter.png"
          alt="Arbiter"
          className="h-34 w-34 rounded-sm object-contain"
        />
        <h1 className="text-6xl font-semibold text-[#E0B15C]">Arbiter</h1>
      </div>

      {/* Center: Group Dropdown */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <Select
          aria-label="Group"
          placeholder="Select a group"
          selectedKeys={selectedGroupId ? [selectedGroupId] : []}
          renderValue={(items) =>
            items.map((item) => (
              <span key={item.key} className="text-[#E0B15C]">
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
              "border-[#E0B15C]/30 bg-[#22130F] text-[#E0B15C] data-[focus=true]:border-[#E0B15C] data-[focus=true]:ring-1 data-[focus=true]:ring-[#E0B15C]/50",
            value: "!text-[#E0B15C] data-[placeholder=true]:text-[#E0B15C]/70",
            listbox: "bg-[#22130F] text-[#E0B15C]",
            popoverContent: "bg-[#22130F] border border-[#E0B15C]/20",
            selectorIcon: "text-[#E0B15C]/70",
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
          <p className="text-[#D9C7A8]">{me?.email ?? ""}</p>
        </div>
        <Tooltip content="Account settings" placement="bottom">
          <Button
            isIconOnly
            variant="light"
            className="rounded-full border border-[#E0B15C]/30 p-0 transition hover:border-[#E0B15C]"
            onPress={onAvatarClick}
            aria-label="Open account menu"
          >
            <Avatar
              size="sm"
              src={me?.avatar_url ?? undefined}
              name={me?.display_name ?? me?.username ?? "User"}
              className="bg-[#E0B15C] text-[#1C110F]"
            />
          </Button>
        </Tooltip>
      </div>
    </nav>
  );
}
