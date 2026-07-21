import { api, apiJson, jsonBody } from "../../lib/api";
import { clearArbiterSessionContextStorage } from "../../lib/sessionStorage";
import type { AvatarSource } from "../avatar/avatarTypes";
import { clearOnboardingSessionState } from "../onboarding/onboardingState";

export type MeResponse = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
  onboarding_tour_version: number | null;
  onboarding_tour_status: "completed" | "skipped" | null;
  onboarding_tour_updated_at: string | null;
};

export type OnboardingTourStatus = "completed" | "skipped";

export type MagicLinkRequestPayload = {
  email: string;
};

export type LocalAuthBypassPayload = {
  token: string;
};

export type UpdateAvatarPayload =
  | {
      avatar_source: "generated";
      avatar_style: string;
      avatar_seed: string;
    }
  | {
      avatar_source: "provider" | "initials";
      avatar_style?: string | null;
      avatar_seed?: string | null;
    };

export async function getMe() {
  return apiJson<MeResponse>("/me", { cache: "no-store" });
}

export async function updateDisplayName(displayName: string) {
  return apiJson<MeResponse>("/me", {
    method: "PATCH",
    ...jsonBody({ display_name: displayName }),
  });
}

export async function updateAvatar(payload: UpdateAvatarPayload) {
  return apiJson<MeResponse>("/me/avatar", {
    method: "PATCH",
    ...jsonBody(payload),
  });
}

export async function updateOnboardingTour(
  version: number,
  status: OnboardingTourStatus,
) {
  return apiJson<MeResponse>("/me/onboarding-tour", {
    method: "PATCH",
    ...jsonBody({ version, status }),
  });
}

export async function requestMagicLink(payload: MagicLinkRequestPayload) {
  return apiJson<{ ok: boolean }>("/auth/magic-link/request", {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function verifyMagicLink(grant: string) {
  return apiJson<{ ok: boolean }>("/auth/magic-link/verify", {
    method: "POST",
    cache: "no-store",
    ...jsonBody({ grant }),
  });
}

export async function localAuthBypass(payload: LocalAuthBypassPayload) {
  return apiJson<{ ok: boolean }>("/auth/local-bypass", {
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
  clearArbiterSessionContextStorage(window.localStorage);
  clearOnboardingSessionState(window.sessionStorage);
  return response;
}
