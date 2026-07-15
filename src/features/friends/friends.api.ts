import { apiJson, jsonBody } from "../../lib/api";
import type { AvatarSource } from "../avatar/avatarTypes";

export type Friend = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
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
  return apiJson<{ ok: boolean }>("/friends/accept", {
    method: "POST",
    ...jsonBody({ code }),
  });
}

export async function unfriend(userId: string) {
  return apiJson<{ ok: boolean; removed: boolean }>("/friends/unfriend", {
    method: "POST",
    ...jsonBody({ user_id: userId }),
  });
}
