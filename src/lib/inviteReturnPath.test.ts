import { describe, expect, it } from "vitest";
import { getValidInviteReturnPath } from "./inviteReturnPath";

describe("getValidInviteReturnPath", () => {
  const token = "a".repeat(43);

  it("accepts only Arbiter invitation routes", () => {
    expect(getValidInviteReturnPath(`/invite/friend/${token}`)).toBe(`/invite/friend/${token}`);
    expect(getValidInviteReturnPath(`/invite/group/${token}`)).toBe(`/invite/group/${token}`);
  });

  it.each([
    "https://evil.example/invite/friend/token",
    "//evil.example/path",
    `/invite/friend/${token}?next=https://evil.example`,
    `/invite/group/${token}#fragment`,
    `%2F%2Fevil.example/${token}`,
    `/app/${token}`,
  ])("rejects unsafe return target %s", (value) => {
    expect(getValidInviteReturnPath(value)).toBeNull();
  });
});
