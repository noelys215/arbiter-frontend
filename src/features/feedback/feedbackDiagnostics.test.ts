import { describe, expect, it } from "vitest";
import { sanitizeFeedbackRoute } from "./feedbackDiagnostics";

describe("sanitizeFeedbackRoute", () => {
  it.each([
    ["/invite/friend/private-token", "/invite/friend/[redacted]"],
    ["/invite/group/private-token?from=email#join", "/invite/group/[redacted]"],
    ["/invite%2Ffriend%2Fencoded-token", "/invite/friend/[redacted]"],
    ["/app/session?secret=value#vote", "/app/session"],
    [
      "https://example.com/invite/group/private-token?x=1",
      "/invite/group/[redacted]",
    ],
  ])("sanitizes %s", (value, expected) => {
    expect(sanitizeFeedbackRoute(value)).toBe(expected);
  });
});
