import { describe, expect, it, vi } from "vitest";
import { invalidateAccountQueries } from "./accountRealtime";

function invalidator() {
  return {
    invalidateQueries: vi.fn(async () => undefined),
  };
}

describe("invalidateAccountQueries", () => {
  it("recovers account state when the socket connects", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, { type: "account_connected" });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(7);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["friends"] },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["friend-requests"] },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["blocked-users"] },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["group-detail"], refetchType: "active" },
      { cancelRefetch: false },
    );
  });

  it("invalidates friends and blocks for friendship events", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, {
      type: "friendship_updated",
      reason: "friendship_created",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["friends"] },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["blocked-users"] },
      { cancelRefetch: false },
    );
  });

  it("invalidates pending requests for friend-request events", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, {
      type: "friend_request_updated",
      reason: "request_created",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledOnce();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["friend-requests"] },
      { cancelRefetch: false },
    );
  });

  it("invalidates invitation queries without refetching unrelated groups", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, {
      type: "group_invite_updated",
      reason: "targeted_invite_created",
      group_id: "group-a",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledOnce();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["group-invitations"] },
      { cancelRefetch: false },
    );
  });

  it("refreshes profile surfaces when a display name changes", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, {
      type: "profile_updated",
      reason: "display_name_updated",
      user_id: "user-a",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(6);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["me"] },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["watchlist-library"], refetchType: "active" },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["session-state"], refetchType: "active" },
      { cancelRefetch: false },
    );
  });

  it("invalidates only the affected group detail", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, {
      type: "group_updated",
      reason: "membership_created",
      group_id: "group-a",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["group-detail", "group-a"], exact: true },
      { cancelRefetch: false },
    );
  });

  it("refreshes only the affected group history after completion", async () => {
    const queryClient = invalidator();
    await invalidateAccountQueries(queryClient, {
      type: "group_updated",
      reason: "session_completed",
      group_id: "group-a",
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["session-history", "group-a"] },
      { cancelRefetch: false },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["session-completion"], refetchType: "active" },
      { cancelRefetch: false },
    );
  });
});
