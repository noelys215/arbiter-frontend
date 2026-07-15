import type { AvatarStyleConfig } from "./avatarTypes";

export const AVATAR_COLLECTIONS = [
  { key: "editorial", label: "Editorial", style: "notionists" },
  { key: "character", label: "Character", style: "adventurer" },
  { key: "sketchbook", label: "Sketchbook", style: "open-peeps" },
  { key: "portrait", label: "Portrait", style: "lorelei" },
  { key: "abstract", label: "Abstract", style: "boring-beam" },
] as const;

export const BORING_AVATAR_PALETTE = [
  "#E0B15C",
  "#C4874F",
  "#F7EAD2",
  "#1C110F",
  "#67412C",
];

export const AVATAR_STYLES = {
  notionists: {
    value: "notionists",
    collection: "editorial",
    generator: "dicebear",
    label: "Editorial",
  },
  adventurer: {
    value: "adventurer",
    collection: "character",
    generator: "dicebear",
    label: "Character",
  },
  "open-peeps": {
    value: "open-peeps",
    collection: "sketchbook",
    generator: "dicebear",
    label: "Sketchbook",
  },
  lorelei: {
    value: "lorelei",
    collection: "portrait",
    generator: "dicebear",
    label: "Portrait",
  },
  "boring-beam": {
    value: "boring-beam",
    collection: "abstract",
    generator: "boring",
    label: "Abstract",
    variant: "beam",
  },
  "boring-bauhaus": {
    value: "boring-bauhaus",
    collection: "abstract",
    generator: "boring",
    label: "Abstract",
    variant: "bauhaus",
  },
  "boring-marble": {
    value: "boring-marble",
    collection: "abstract",
    generator: "boring",
    label: "Abstract",
    variant: "marble",
  },
} satisfies Record<string, AvatarStyleConfig>;

export type AvatarStyleValue = keyof typeof AVATAR_STYLES;

export function getAvatarStyleConfig(
  style: string | null | undefined,
): AvatarStyleConfig | null {
  if (!style) return null;
  return AVATAR_STYLES[style as AvatarStyleValue] ?? null;
}
