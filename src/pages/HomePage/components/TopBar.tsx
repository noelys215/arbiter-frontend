import { Button, Tooltip } from "@heroui/react";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import BrandLockup from "../../../components/BrandLockup";
import type { MeResponse } from "../../../features/auth/auth.api";

type TopBarProps = {
  me: MeResponse | undefined;
  onAvatarClick: () => void;
};

export default function TopBar({
  me,
  onAvatarClick,
}: TopBarProps) {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[#E0B15C]/12 bg-[#100806]/88 px-4 py-3 backdrop-blur-sm sm:px-6"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <BrandLockup
          logoClassName="h-10 w-10 sm:h-14 sm:w-14"
          titleClassName="text-3xl sm:text-4xl"
          versionClassName="sr-only"
        />

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
            className="h-12 w-12 min-w-12 rounded-full border border-[#E0B15C]/20 p-0 transition hover:border-[#E0B15C]/55 sm:h-14 sm:w-14 sm:min-w-14"
            onPress={onAvatarClick}
            aria-label="Open account menu"
          >
            <ArbiterAvatar
              user={me}
              size="lg"
              className="bg-[#E0B15C] text-[#1C110F]"
              decorative
            />
          </Button>
        </Tooltip>
      </div>
    </nav>
  );
}
