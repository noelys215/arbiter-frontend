const KOFI_DESTINATION = "https://ko-fi.com/H4L223A4I2";

function validateKoFiUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "ko-fi.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const publicLinks = {
  koFi: validateKoFiUrl(KOFI_DESTINATION),
} as const;
