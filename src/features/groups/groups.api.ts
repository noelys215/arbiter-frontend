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
  email: string;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
};

export type GroupDetail = Group & {
  members: GroupMember[];
};

export type InviteResponse = {
    code: string;
};

export type GroupLinkInvite = {
  id: string;
  token: string;
  code: string;
  group_id: string;
  target_user_id: string | null;
  expires_at: string;
  max_uses: number;
  uses_count: number;
};

export type GroupInvitePublicUser = Omit<GroupMember, "email">;

export type GroupInvitePreview = {
  group_id: string;
  group_name: string;
  inviter: GroupInvitePublicUser;
  member_count: number;
  expires_at: string;
  targeted: boolean;
};

export type GroupInvitation = {
  id: string;
  group_id: string;
  group_name: string;
  inviter: GroupInvitePublicUser;
  target: GroupInvitePublicUser | null;
  expires_at: string;
  max_uses: number;
  uses_count: number;
  targeted: boolean;
};

export type AddGroupMembersPayload = {
  member_user_ids: string[];
};

export type AddGroupMembersResponse = {
  ok: boolean;
  added_user_ids: string[];
  skipped_user_ids: string[];
};

export async function getGroups() {
  return apiJson<Group[]>("/groups");
}

export type CreateGroupPayload = {
  name: string;
  member_user_ids?: string[];
};

export async function createGroup(payload: CreateGroupPayload) {
  return apiJson<Group>("/groups", {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function addGroupMembers(
  groupId: string,
  payload: AddGroupMembersPayload,
) {
  return apiJson<AddGroupMembersResponse>(`/groups/${groupId}/members`, {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function getGroup(groupId: string) {
  return apiJson<GroupDetail>(`/groups/${groupId}`);
}

export async function acceptGroupInvite(code: string) {
  const response = await api("/groups/accept-invite", {
    method: "POST",
    ...jsonBody({ code }),
  });
  if (!response.ok) {
    const error = new Error("Accept invite failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}

export async function createGroupInvite(groupId: string) {
  return apiJson<InviteResponse>(`/groups/${groupId}/invite`, {
    method: "POST",
  });
}

export async function createGroupLinkInvite(
  groupId: string,
  targetUserId?: string,
) {
  return apiJson<GroupLinkInvite>(`/groups/${groupId}/invites`, {
    method: "POST",
    ...jsonBody({
      target_user_id: targetUserId ?? null,
      max_uses: targetUserId ? 1 : 25,
    }),
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

export async function previewGroupInvite(token: string) {
  return apiJson<GroupInvitePreview>(`/invites/group/${encodeURIComponent(token)}`);
}

export async function acceptGroupLinkInvite(token: string) {
  return apiJson<{
    ok: boolean;
    decision: "accepted";
    already_member: boolean;
  }>(`/invites/group/${encodeURIComponent(token)}/accept`, {
    method: "POST",
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
