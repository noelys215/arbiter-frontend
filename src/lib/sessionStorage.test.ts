import { beforeEach, describe, expect, it } from "vitest";
import { clearArbiterSessionContextStorage } from "./sessionStorage";

describe("clearArbiterSessionContextStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes only account-scoped group and session context", () => {
    const sessionKeys = [
      "arbiter:lastGroupId",
      "arbiter:active-session:group-1",
      "arbiter:session-card-index:session-1",
      "arbiter:session-context:session-1",
      "arbiter:session-deal-submitted:session-1",
      "arbiter:deal-submitted:session-1",
    ];
    const preservedEntries = {
      "arbiter:auth-handoff": "handoff",
      "arbiter:movie-night-card-preferences": "preferences",
      "other-app:key": "unrelated",
    };

    sessionKeys.forEach((key) => localStorage.setItem(key, "sensitive"));
    Object.entries(preservedEntries).forEach(([key, value]) =>
      localStorage.setItem(key, value),
    );

    clearArbiterSessionContextStorage(localStorage);

    sessionKeys.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    Object.entries(preservedEntries).forEach(([key, value]) =>
      expect(localStorage.getItem(key)).toBe(value),
    );
  });
});
