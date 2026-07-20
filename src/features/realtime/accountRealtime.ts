import type { QueryClient } from "@tanstack/react-query";

export type AccountRealtimeMessage = {
  type?:
    | "account_connected"
    | "friendship_updated"
    | "friend_request_updated"
    | "group_invite_updated"
    | "group_updated"
    | "profile_updated"
    | "pong";
  reason?: string;
  group_id?: string;
  member_user_id?: string;
  user_id?: string;
};

type QueryInvalidator = Pick<QueryClient, "invalidateQueries">;

const backgroundOptions = { cancelRefetch: false } as const;

export async function invalidateAccountQueries(
  queryClient: QueryInvalidator,
  message: AccountRealtimeMessage,
) {
  if (message.type === "account_connected") {
    await Promise.all([
      queryClient.invalidateQueries(
        { queryKey: ["friends"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["friend-requests"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["blocked-users"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["groups"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["group-detail"], refetchType: "active" },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["group-invitations"], refetchType: "active" },
        backgroundOptions,
      ),
    ]);
    return;
  }

  if (message.type === "friendship_updated") {
    await Promise.all([
      queryClient.invalidateQueries(
        { queryKey: ["friends"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["blocked-users"] },
        backgroundOptions,
      ),
    ]);
    return;
  }

  if (message.type === "friend_request_updated") {
    await queryClient.invalidateQueries(
      { queryKey: ["friend-requests"] },
      backgroundOptions,
    );
    return;
  }

  if (message.type === "profile_updated") {
    await Promise.all([
      queryClient.invalidateQueries(
        { queryKey: ["me"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["friends"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["group-detail"], refetchType: "active" },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["watchlist-library"], refetchType: "active" },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["session-state"], refetchType: "active" },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["session-watchlist"], refetchType: "active" },
        backgroundOptions,
      ),
    ]);
    return;
  }

  if (message.type === "group_invite_updated") {
    await queryClient.invalidateQueries(
      { queryKey: ["group-invitations"] },
      backgroundOptions,
    );
    return;
  }

  if (message.type === "group_updated" && message.group_id) {
    await Promise.all([
      queryClient.invalidateQueries(
        { queryKey: ["groups"] },
        backgroundOptions,
      ),
      queryClient.invalidateQueries(
        { queryKey: ["group-detail", message.group_id], exact: true },
        backgroundOptions,
      ),
    ]);
  }
}
