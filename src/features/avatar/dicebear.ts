import { Avatar, Style } from "@dicebear/core";

import type { AvatarStyleConfig } from "./avatarTypes";

type StyleDefinitionModule = { default: unknown };

const styleCache = new Map<string, Style>();

async function importDiceBearStyle(style: string) {
  switch (style) {
    case "notionists":
      return import("@dicebear/styles/notionists.json");
    case "adventurer":
      return import("@dicebear/styles/adventurer.json");
    case "open-peeps":
      return import("@dicebear/styles/open-peeps.json");
    case "lorelei":
      return import("@dicebear/styles/lorelei.json");
    default:
      throw new Error("Unsupported avatar style");
  }
}

export async function renderDiceBearAvatar(
  styleConfig: AvatarStyleConfig,
  seed: string,
) {
  let style = styleCache.get(styleConfig.value);
  if (!style) {
    const module = (await importDiceBearStyle(
      styleConfig.value,
    )) as StyleDefinitionModule;
    style = new Style(module.default);
    styleCache.set(styleConfig.value, style);
  }

  return new Avatar(style, {
    seed,
    size: 128,
  }).toDataUri();
}
