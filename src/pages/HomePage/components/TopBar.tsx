import { Avatar, Button, Select, SelectItem, Tooltip } from "@heroui/react";
import BrandLockup from "../../../components/BrandLockup";
import { theaterSelectClassNames } from "../../../lib/selectTheme";
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
  const groupLabelId = "topbar-group-label";

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[#E0B15C]/20 bg-[#140C0A]/95 px-4 py-3 backdrop-blur-sm sm:px-6"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Logo */}
          <BrandLockup />

          {/* Right: Avatar */}
          <div className="flex items-center gap-3">
            <Tooltip
              content="Account settings"
              placement="bottom"
              classNames={{
                content:
                  "border border-[#E0B15C]/25 bg-[#22130F] text-[#F7F1E3]",
              }}
            >
              <Button
                isIconOnly
                variant="light"
                className="h-16 w-16 min-w-14 rounded-full border border-[#E0B15C]/30 p-0 transition hover:border-[#E0B15C]"
                onPress={onAvatarClick}
                aria-label="Open account menu"
              >
                <Avatar
                  size="lg"
                  src={me?.avatar_url ?? undefined}
                  name={me?.display_name ?? me?.username ?? "User"}
                  className="bg-[#E0B15C] text-[#1C110F]"
                />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Center: Group Dropdown */}
        <div className="flex items-center justify-center gap-3">
          <span
            id={groupLabelId}
            className="text-sm font-medium text-[#D9C7A8]"
          >
            Group:
          </span>
          <Select
            aria-labelledby={groupLabelId}
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
            className="max-w-40 min-w-40 sm:max-w-44 sm:min-w-44"
            classNames={theaterSelectClassNames}
          >
            {(groups ?? []).map((group) => (
              <SelectItem key={group.id}>{group.name}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </nav>
  );
}
