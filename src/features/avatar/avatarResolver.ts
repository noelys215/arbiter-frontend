import { getAvatarStyleConfig } from "./avatarConfig";
import type { AvatarSource, AvatarUser } from "./avatarTypes";

export function getDisplayName(user: AvatarUser | null | undefined) {
  return (
    user?.display_name?.trim() ||
    user?.username?.trim() ||
    user?.email?.trim() ||
    "User"
  );
}

export function resolveAvatarSource(user: AvatarUser | null | undefined) {
  const requestedSource: AvatarSource | null = user?.avatar_source ?? null;

  if (requestedSource === "initials") {
    return { source: "initials" as const };
  }

  if (requestedSource === "generated") {
    const style = getAvatarStyleConfig(user?.avatar_style);
    if (style && user?.avatar_seed) {
      return {
        source: "generated" as const,
        style,
        seed: user.avatar_seed,
      };
    }
    return { source: "initials" as const };
  }

  if (requestedSource === "provider") {
    if (user?.avatar_url) {
      return { source: "provider" as const, url: user.avatar_url };
    }
    return { source: "initials" as const };
  }

  if (user?.avatar_url) {
    return { source: "provider" as const, url: user.avatar_url };
  }

  return { source: "initials" as const };
}

export function makeAvatarSeed() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
