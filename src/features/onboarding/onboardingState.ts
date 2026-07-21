import type { MeResponse, OnboardingTourStatus } from "../auth/auth.api";

export const CURRENT_ONBOARDING_TOUR_VERSION = 1;
export const TOUR_STORAGE_KEY = `arbiter:onboarding-tour:v${CURRENT_ONBOARDING_TOUR_VERSION}`;
export const TOUR_SESSION_DISMISSED_KEY =
  `arbiter:onboarding-tour:dismissed:v${CURRENT_ONBOARDING_TOUR_VERSION}`;

export type StoredTourState = {
  version: number;
  status: OnboardingTourStatus;
  updatedAt: string;
};

export type TourEligibilityInput = {
  me: MeResponse | undefined;
  groupsReady: boolean;
  hasGroup: boolean;
  watchlistReady: boolean;
  blockingOverlayOpen: boolean;
  authContinuation: boolean;
  dismissedForSession: boolean;
};

export function hasResolvedCurrentTour(me: MeResponse | undefined) {
  return Boolean(
    me &&
      me.onboarding_tour_version !== null &&
      me.onboarding_tour_version >= CURRENT_ONBOARDING_TOUR_VERSION &&
      (me.onboarding_tour_status === "completed" ||
        me.onboarding_tour_status === "skipped"),
  );
}

export function isAutoTourEligible(input: TourEligibilityInput) {
  return Boolean(
    input.me &&
      input.groupsReady &&
      input.hasGroup &&
      input.watchlistReady &&
      !input.blockingOverlayOpen &&
      !input.authContinuation &&
      !input.dismissedForSession &&
      !hasResolvedCurrentTour(input.me),
  );
}

export function readLocalTourState(
  storage: Pick<Storage, "getItem">,
): StoredTourState | null {
  try {
    const raw = storage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTourState>;
    if (
      parsed.version !== CURRENT_ONBOARDING_TOUR_VERSION ||
      (parsed.status !== "completed" && parsed.status !== "skipped") ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return parsed as StoredTourState;
  } catch {
    return null;
  }
}

export function writeLocalTourState(
  storage: Pick<Storage, "setItem">,
  status: OnboardingTourStatus,
) {
  const value: StoredTourState = {
    version: CURRENT_ONBOARDING_TOUR_VERSION,
    status,
    updatedAt: new Date().toISOString(),
  };
  storage.setItem(TOUR_STORAGE_KEY, JSON.stringify(value));
  return value;
}

export function reconcileLocalTourState(
  me: MeResponse,
  storage: Pick<Storage, "setItem" | "removeItem">,
) {
  if (hasResolvedCurrentTour(me) && me.onboarding_tour_status) {
    storage.setItem(
      TOUR_STORAGE_KEY,
      JSON.stringify({
        version: CURRENT_ONBOARDING_TOUR_VERSION,
        status: me.onboarding_tour_status,
        updatedAt: me.onboarding_tour_updated_at ?? new Date().toISOString(),
      } satisfies StoredTourState),
    );
    return;
  }
  storage.removeItem(TOUR_STORAGE_KEY);
}

export function clearOnboardingSessionState(
  storage: Pick<Storage, "removeItem">,
) {
  storage.removeItem(TOUR_SESSION_DISMISSED_KEY);
}
