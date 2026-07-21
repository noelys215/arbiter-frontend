import { beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "./auth.api";

describe("logout", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("arbiter:session-context:session-1", "context");
    localStorage.setItem("arbiter:auth-handoff", "handoff");
    vi.unstubAllGlobals();
  });

  it("clears session context after a successful logout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

    await logout();

    expect(localStorage.getItem("arbiter:session-context:session-1")).toBeNull();
    expect(localStorage.getItem("arbiter:auth-handoff")).toBe("handoff");
  });

  it("retains context when logout fails and the account remains active", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));

    await expect(logout()).rejects.toThrow("Logout failed");

    expect(localStorage.getItem("arbiter:session-context:session-1")).toBe(
      "context",
    );
  });
});
