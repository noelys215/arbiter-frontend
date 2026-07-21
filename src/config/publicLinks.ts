import { normalizeExternalHttpsUrl } from "../lib/externalLinks";

const KOFI_DESTINATION = "https://ko-fi.com/H4L223A4I2";

export const publicLinks = {
  koFi: normalizeExternalHttpsUrl(KOFI_DESTINATION, ["ko-fi.com"]),
} as const;
