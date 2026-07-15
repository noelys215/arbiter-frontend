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

function sizeToPixels(size: ArbiterAvatarSize) {
  return typeof size === "number" ? size : sizeMap[size];
}

function heroSize(size: ArbiterAvatarSize) {
  return typeof size === "number" ? undefined : size;
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
      size={heroSize(size)}
      src={resolved.source === "provider" ? resolved.url : undefined}
      name={name}
      showFallback
      isBordered={isBordered}
      radius={radius}
      className={className ?? "bg-[#E0B15C] text-[#1C110F]"}
      imgProps={{ referrerPolicy: "no-referrer" }}
    />
  );
}
