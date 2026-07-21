import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  updateOnboardingTour,
  type MeResponse,
  type OnboardingTourStatus,
} from "../auth/auth.api";
import {
  CURRENT_ONBOARDING_TOUR_VERSION,
  TOUR_SESSION_DISMISSED_KEY,
  isAutoTourEligible,
  reconcileLocalTourState,
  writeLocalTourState,
} from "./onboardingState";
type OnboardingTourModule = typeof import("./onboardingTour");

type UseOnboardingTourOptions = {
  me: MeResponse | undefined;
  groupsReady: boolean;
  hasGroup: boolean;
  watchlistReady: boolean;
  watchlistCount: number;
  blockingOverlayOpen: boolean;
};

function isMobileViewport() {
  return window.matchMedia("(max-width: 767px)").matches;
}

export function useOnboardingTour(options: UseOnboardingTourOptions) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const autoStartAttempted = useRef(false);
  const tourModuleRef = useRef<OnboardingTourModule | null>(null);

  useEffect(() => {
    if (!options.me) return;
    reconcileLocalTourState(options.me, window.localStorage);
  }, [options.me]);

  const persistDisposition = useCallback(
    (status: OnboardingTourStatus) => {
      const localState = writeLocalTourState(window.localStorage, status);
      window.sessionStorage.setItem(TOUR_SESSION_DISMISSED_KEY, "true");
      queryClient.setQueryData<MeResponse>(["me"], (current) =>
        current
          ? {
              ...current,
              onboarding_tour_version: CURRENT_ONBOARDING_TOUR_VERSION,
              onboarding_tour_status: status,
              onboarding_tour_updated_at: localState.updatedAt,
            }
          : current,
      );
      void updateOnboardingTour(CURRENT_ONBOARDING_TOUR_VERSION, status)
        .then((me) => queryClient.setQueryData(["me"], me))
        .catch(() => undefined);
    },
    [queryClient],
  );

  const launch = useCallback(
    async ({
      manual,
      restoreFocusTo,
    }: {
      manual: boolean;
      restoreFocusTo?: HTMLElement | null;
    }) => {
      const tourModule = await import("./onboardingTour");
      tourModuleRef.current = tourModule;
      return tourModule.startOnboardingTour({
        manual,
        hasGroup: options.hasGroup,
        watchlistCount: options.watchlistCount,
        isMobile: isMobileViewport(),
        restoreFocusTo,
        onDisposition: (disposition) => {
          window.sessionStorage.setItem(TOUR_SESSION_DISMISSED_KEY, "true");
          if (
            !manual &&
            (disposition === "completed" || disposition === "skipped")
          ) {
            persistDisposition(disposition);
          }
        },
      });
    },
    [
      options.hasGroup,
      options.watchlistCount,
      persistDisposition,
    ],
  );

  useEffect(() => {
    const authContinuation =
      new URLSearchParams(location.search).has("auth") ||
      location.pathname.startsWith("/auth/");
    const dismissedForSession =
      window.sessionStorage.getItem(TOUR_SESSION_DISMISSED_KEY) === "true";

    if (
      autoStartAttempted.current ||
      !isAutoTourEligible({
        me: options.me,
        groupsReady: options.groupsReady,
        hasGroup: options.hasGroup,
        watchlistReady: options.watchlistReady,
        blockingOverlayOpen: options.blockingOverlayOpen,
        authContinuation,
        dismissedForSession,
      })
    ) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      autoStartAttempted.current = true;
      void launch({ manual: false });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    launch,
    location.pathname,
    location.search,
    options.blockingOverlayOpen,
    options.groupsReady,
    options.hasGroup,
    options.me,
    options.watchlistReady,
  ]);

  useEffect(
    () => () => tourModuleRef.current?.destroyActiveOnboardingTour(false),
    [],
  );

  return {
    replayTour: (restoreFocusTo?: HTMLElement | null) =>
      launch({ manual: true, restoreFocusTo }),
  };
}
