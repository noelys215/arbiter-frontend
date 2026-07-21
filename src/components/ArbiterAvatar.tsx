import { Avatar } from "@heroui/react";
import { lazy, Suspense } from "react";

import {
  getDisplayName,
  resolveAvatarSource,
} from "../features/avatar/avatarResolver";
import type { AvatarUser } from "../features/avatar/avatarTypes";

const GeneratedAvatar = lazy(() => import("../features/avatar/GeneratedAvatar"));

type ArbiterAvatarSize = "sm" | "md" | "lg" | number;

type ArbiterAvatarProps = {
  user: AvatarUser | null | undefined;
  size?: ArbiterAvatarSize;
  className?: string;
  decorative?: boolean;
  label?: string;
  isBordered?: boolean;
  radius?: "none" | "sm" | "md" | "lg" | "full";
};

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
};

const radiusClass = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

function sizeToPixels(size: ArbiterAvatarSize) {
  return typeof size === "number" ? size : sizeMap[size];
}

export default function ArbiterAvatar({
  user,
  size = "md",
  className,
  decorative = false,
  label,
  isBordered = false,
  radius = "full",
}: ArbiterAvatarProps) {
  const name = getDisplayName(user);
  const resolved = resolveAvatarSource(user);
  const avatarLabel = label ?? name;
  const pixelSize = sizeToPixels(size);

  if (resolved.source === "generated") {
    return (
      <span
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : avatarLabel}
        role={decorative ? undefined : "img"}
        className={[
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E0B15C]/15 text-[#1C110F]",
          isBordered ? "ring-2 ring-[#E0B15C]/55" : "",
          className ?? "",
        ].join(" ")}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Suspense
          fallback={
            <span
              aria-hidden="true"
              className="block h-full w-full animate-pulse rounded-full bg-[#E0B15C]/15"
            />
          }
        >
          <GeneratedAvatar
            styleConfig={resolved.style}
            seed={resolved.seed}
            size={pixelSize}
            label={avatarLabel}
            decorative
          />
        </Suspense>
      </span>
    );
  }

  return (
    <Avatar
      aria-label={decorative ? undefined : avatarLabel}
      className={[
        className ?? "bg-[#E0B15C] text-[#1C110F]",
        isBordered ? "ring-2 ring-[#E0B15C]/55" : "",
        radiusClass[radius],
      ].join(" ")}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {resolved.source === "provider" ? (
        <Avatar.Image
          src={resolved.url}
          alt={decorative ? "" : avatarLabel}
          referrerPolicy="no-referrer"
        />
      ) : null}
      <Avatar.Fallback
        aria-hidden={decorative ? true : undefined}
        className="!text-[#1C110F]"
      >
        {name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </Avatar.Fallback>
    </Avatar>
  );
}
