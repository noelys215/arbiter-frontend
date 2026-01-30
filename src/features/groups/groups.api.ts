import { api, apiJson, jsonBody } from "../../lib/api";

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
};

export type GroupDetail = Group & {
  members: GroupMember[];
};

export type InviteResponse = {
  code: string;
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
