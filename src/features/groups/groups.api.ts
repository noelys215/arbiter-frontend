import { api, apiJson, jsonBody } from "../../lib/api";
import type { AvatarSource } from "../avatar/avatarTypes";

export type Group = {
  id: string;
  name: string;
  owner_id?: string;
  created_at?: string;
  member_count?: number;
};

export type GroupMember = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
};

export type GroupDetail = Group & {
  members: GroupMember[];
};

export type GroupInvite = {
  id: string;
  group_id: string;
  target_user_id: string;
  expires_at: string;
};

export type GroupInvitePublicUser = GroupMember;

export type GroupInvitation = {
  id: string;
  group_id: string;
  group_name: string;
  inviter: GroupInvitePublicUser;
  target: GroupInvitePublicUser;
  expires_at: string;
};

export async function getGroups() {
  return apiJson<Group[]>("/groups");
}

export type CreateGroupPayload = {
  name: string;
};

export async function createGroup(payload: CreateGroupPayload) {
  return apiJson<Group>("/groups", {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function updateGroup(groupId: string, name: string) {
  return apiJson<Group>(`/groups/${groupId}`, {
    method: "PATCH",
    ...jsonBody({ name }),
  });
}

export async function getGroup(groupId: string) {
  return apiJson<GroupDetail>(`/groups/${groupId}`);
}

export async function createGroupInvitation(
  groupId: string,
  targetUserId: string,
) {
  return apiJson<GroupInvite>(`/groups/${groupId}/invites`, {
    method: "POST",
    ...jsonBody({ target_user_id: targetUserId }),
  });
}

export async function getGroupInvitations(groupId?: string) {
  const query = groupId ? `?group_id=${encodeURIComponent(groupId)}` : "";
  return apiJson<GroupInvitation[]>(`/group-invites${query}`);
}

export async function decideGroupInvitation(
  inviteId: string,
  decision: "accept" | "decline",
) {
  return apiJson<{
    ok: boolean;
    decision: "accepted" | "declined";
    already_member: boolean;
  }>(`/group-invites/${encodeURIComponent(inviteId)}/decision`, {
    method: "POST",
    ...jsonBody({ decision }),
  });
}

export async function revokeGroupInvite(inviteId: string) {
  const response = await api(`/group-invites/${encodeURIComponent(inviteId)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Could not revoke invitation");
}

export async function leaveGroup(groupId: string) {
  const response = await api(`/groups/${groupId}/leave`, { method: "POST" });
  if (!response.ok) {
    const error = new Error("Leave group failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}

export async function deleteGroup(groupId: string) {
  const response = await api(`/groups/${groupId}`, { method: "DELETE" });
  if (!response.ok) {
    const error = new Error("Delete group failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}

export async function transferGroupOwnership(
  groupId: string,
  newOwnerUserId: string,
) {
  return apiJson<Group>(`/groups/${encodeURIComponent(groupId)}/transfer-ownership`, {
    method: "POST",
    ...jsonBody({ new_owner_user_id: newOwnerUserId }),
  });
}
