import { useEffect, useState } from "react";

import { BORING_AVATAR_PALETTE } from "./avatarConfig";
import { renderDiceBearAvatar } from "./dicebear";
import type { AvatarStyleConfig } from "./avatarTypes";

type BoringAvatarComponent = typeof import("boring-avatars").default;

const boringAvatarCache: {
  component: BoringAvatarComponent | null;
  promise: Promise<BoringAvatarComponent> | null;
} = {
  component: null,
  promise: null,
};

async function loadBoringAvatar() {
  if (boringAvatarCache.component) return boringAvatarCache.component;
  if (!boringAvatarCache.promise) {
    boringAvatarCache.promise = import("boring-avatars").then((module) => {
      boringAvatarCache.component = module.default;
      return module.default;
    });
  }
  return boringAvatarCache.promise;
}

type GeneratedAvatarProps = {
  styleConfig: AvatarStyleConfig;
  seed: string;
  size: number;
  label: string;
  decorative?: boolean;
};

export default function GeneratedAvatar({
  styleConfig,
  seed,
  size,
  label,
  decorative = false,
}: GeneratedAvatarProps) {
  const [diceBearUri, setDiceBearUri] = useState<string | null>(null);
  const [diceBearKey, setDiceBearKey] = useState<string | null>(null);
  const [BoringAvatar, setBoringAvatar] =
    useState<BoringAvatarComponent | null>(() => boringAvatarCache.component);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const renderKey = `${styleConfig.value}:${seed}`;

  useEffect(() => {
    let isActive = true;

    if (styleConfig.generator === "dicebear") {
      renderDiceBearAvatar(styleConfig, seed)
        .then((uri) => {
          if (isActive) {
            setDiceBearUri(uri);
            setDiceBearKey(renderKey);
            setFailedKey(null);
          }
        })
        .catch(() => {
          if (isActive) setFailedKey(renderKey);
        });
      return () => {
        isActive = false;
      };
    }

    if (!BoringAvatar) {
      loadBoringAvatar()
        .then((component) => {
          if (isActive) {
            setBoringAvatar(() => component);
            setFailedKey(null);
          }
        })
        .catch(() => {
          if (isActive) setFailedKey(renderKey);
        });
    }

    return () => {
      isActive = false;
    };
  }, [BoringAvatar, renderKey, seed, styleConfig]);

  if (failedKey === renderKey) return null;

  const sizeStyle = { width: size, height: size };

  if (styleConfig.generator === "boring" && BoringAvatar && styleConfig.variant) {
    return (
      <BoringAvatar
        name={seed}
        variant={styleConfig.variant}
        colors={BORING_AVATAR_PALETTE}
        size={size}
        title={false}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : label}
        role={decorative ? undefined : "img"}
        className="block h-full w-full"
      />
    );
  }

  if (
    styleConfig.generator === "dicebear" &&
    diceBearUri &&
    diceBearKey === renderKey
  ) {
    return (
      <img
        src={diceBearUri}
        alt={decorative ? "" : label}
        aria-hidden={decorative ? true : undefined}
        className="block h-full w-full"
        style={sizeStyle}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block animate-pulse rounded-full bg-[#E0B15C]/15"
      style={sizeStyle}
    />
  );
}
