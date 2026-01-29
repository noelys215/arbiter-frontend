import { api, apiJson, jsonBody } from "../../lib/api";

export type Friend = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type InviteResponse = {
  code: string;
  expires_at: string;
};

export async function getFriends() {
  return apiJson<Friend[]>("/friends");
}

export async function createFriendInvite() {
  return apiJson<InviteResponse>("/friends/invite", { method: "POST" });
}

export async function acceptFriendInvite(code: string) {
  const response = await api("/friends/accept", {
    method: "POST",
    ...jsonBody({ code }),
  });
  if (!response.ok) {
    const error = new Error("Accept friend invite failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}

export async function unfriend(userId: string) {
  const response = await api("/friends/unfriend", {
    method: "POST",
    ...jsonBody({ user_id: userId }),
  });
  if (!response.ok) {
    const error = new Error("Unfriend failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}
