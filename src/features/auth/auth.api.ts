import { api, apiJson, jsonBody } from "../../lib/api";

export type MeResponse = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type MagicLinkRequestPayload = {
  email: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  display_name: string;
  password: string;
};

export async function getMe() {
  return apiJson<MeResponse>("/me", { cache: "no-store" });
}

export async function login(payload: LoginPayload) {
  const response = await api("/auth/login", {
    method: "POST",
    ...jsonBody(payload),
  });
  if (!response.ok) {
    const error = new Error("Login failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}

export async function register(payload: RegisterPayload) {
  const response = await api("/auth/register", {
    method: "POST",
    ...jsonBody(payload),
  });
  if (!response.ok) {
    const error = new Error("Registration failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}

export async function requestMagicLink(payload: MagicLinkRequestPayload) {
  return apiJson<{ ok: boolean }>("/auth/magic-link/request", {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function logout() {
  const response = await api("/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) {
    const error = new Error("Logout failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response;
}
