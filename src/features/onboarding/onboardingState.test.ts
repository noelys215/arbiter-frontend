import { beforeEach, describe, expect, it } from "vitest";
import type { MeResponse } from "../auth/auth.api";
import {
  CURRENT_ONBOARDING_TOUR_VERSION,
  TOUR_STORAGE_KEY,
  TOUR_SESSION_DISMISSED_KEY,
  clearOnboardingSessionState,
  hasResolvedCurrentTour,
  isAutoTourEligible,
  readLocalTourState,
  reconcileLocalTourState,
  writeLocalTourState,
} from "./onboardingState";

const me = (overrides: Partial<MeResponse> = {}): MeResponse => ({
  id: "user-1",
  email: "person@example.test",
  username: "person",
  display_name: "Person",
  avatar_url: null,
  avatar_source: null,
  avatar_style: null,
  avatar_seed: null,
  onboarding_tour_version: null,
  onboarding_tour_status: null,
  onboarding_tour_updated_at: null,
  ...overrides,
});

describe("onboarding tour persistence and eligibility", () => {
  beforeEach(() => window.localStorage.clear());

  it("requires ready group content and an unresolved version", () => {
    const base = {
      me: me(),
      groupsReady: true,
      hasGroup: true,
      watchlistReady: true,
      blockingOverlayOpen: false,
      authContinuation: false,
      dismissedForSession: false,
    };
    expect(isAutoTourEligible(base)).toBe(true);
    expect(isAutoTourEligible({ ...base, hasGroup: false })).toBe(false);
    expect(isAutoTourEligible({ ...base, watchlistReady: false })).toBe(false);
    expect(isAutoTourEligible({ ...base, blockingOverlayOpen: true })).toBe(false);
    expect(isAutoTourEligible({ ...base, authContinuation: true })).toBe(false);
    expect(isAutoTourEligible({ ...base, dismissedForSession: true })).toBe(false);
  });

  it("treats completion and skipping at the current or newer version as resolved", () => {
    expect(
      hasResolvedCurrentTour(
        me({ onboarding_tour_version: 1, onboarding_tour_status: "completed" }),
      ),
    ).toBe(true);
    expect(
      hasResolvedCurrentTour(
        me({ onboarding_tour_version: 2, onboarding_tour_status: "skipped" }),
      ),
    ).toBe(true);
    expect(
      hasResolvedCurrentTour(
        me({ onboarding_tour_version: 0, onboarding_tour_status: "completed" }),
      ),
    ).toBe(false);
  });

  it("stores only version, status, and timestamp", () => {
    writeLocalTourState(window.localStorage, "completed");
    const state = readLocalTourState(window.localStorage);
    expect(state).toMatchObject({
      version: CURRENT_ONBOARDING_TOUR_VERSION,
      status: "completed",
    });
    expect(Object.keys(state ?? {}).sort()).toEqual([
      "status",
      "updatedAt",
      "version",
    ]);
  });

  it("rejects malformed fallback state and lets the server reconcile it", () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "not-json");
    expect(readLocalTourState(window.localStorage)).toBeNull();

    writeLocalTourState(window.localStorage, "skipped");
    reconcileLocalTourState(me(), window.localStorage);
    expect(window.localStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();

    reconcileLocalTourState(
      me({
        onboarding_tour_version: 1,
        onboarding_tour_status: "completed",
        onboarding_tour_updated_at: "2026-07-21T12:00:00Z",
      }),
      window.localStorage,
    );
    expect(readLocalTourState(window.localStorage)?.status).toBe("completed");
  });

  it("clears only the session dismissal marker on logout", () => {
    window.sessionStorage.setItem(TOUR_SESSION_DISMISSED_KEY, "true");
    clearOnboardingSessionState(window.sessionStorage);
    expect(window.sessionStorage.getItem(TOUR_SESSION_DISMISSED_KEY)).toBeNull();
  });
});
