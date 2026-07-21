import { apiJson, jsonBody } from "../../lib/api";
import type { AvatarSource } from "../avatar/avatarTypes";

export type Friend = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
};

export type InvitePublicUser = Friend;

export type BlockedUser = InvitePublicUser & {
  blocked_at: string;
};

export type FriendRequest = {
  id: string;
  direction: "incoming" | "outgoing";
  user: InvitePublicUser;
  created_at: string;
  expires_at: string;
};

export type FriendRequestsResponse = {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

export async function getFriends() {
  return apiJson<Friend[]>("/friends");
}

export async function getFriendRequests() {
  return apiJson<FriendRequestsResponse>("/friends/requests");
}

export async function getBlockedUsers() {
  return apiJson<BlockedUser[]>("/friends/blocked");
}

export async function sendFriendRequest(identifier: string) {
  return apiJson<{ ok: boolean }>("/friends/requests", {
    method: "POST",
    ...jsonBody({ identifier }),
  });
}

export async function decideFriendRequest(
  requestId: string,
  decision: "accept" | "decline",
) {
  return apiJson<{
    ok: boolean;
    decision: "accepted" | "declined";
    already_friends: boolean;
  }>(`/friends/requests/${encodeURIComponent(requestId)}/decision`, {
    method: "POST",
    ...jsonBody({ decision }),
  });
}

export async function cancelFriendRequest(requestId: string) {
  return apiJson<{ ok: boolean; decision: "cancelled" }>(
    `/friends/requests/${encodeURIComponent(requestId)}`,
    { method: "DELETE" },
  );
}

export async function unfriend(userId: string) {
  return apiJson<{ ok: boolean; removed: boolean }>("/friends/unfriend", {
    method: "POST",
    ...jsonBody({ user_id: userId }),
  });
}

export async function blockUser(userId: string) {
  return apiJson<{ ok: boolean; already_blocked: boolean }>(
    `/friends/${encodeURIComponent(userId)}/block`,
    { method: "POST" },
  );
}

export async function unblockUser(userId: string) {
  return apiJson<{ ok: boolean; already_blocked: boolean }>(
    `/friends/${encodeURIComponent(userId)}/block`,
    { method: "DELETE" },
  );
}
