const INVITE_RETURN_PATH = /^\/invite\/(friend|group)\/[A-Za-z0-9_-]{43}$/;

export function getValidInviteReturnPath(value: string | null | undefined) {
  if (!value || value.includes("%") || value.includes("\\") || value.startsWith("//")) {
    return null;
  }
  return INVITE_RETURN_PATH.test(value) ? value : null;
}
