import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "../auth/auth.api";
import { TOUR_SESSION_DISMISSED_KEY } from "./onboardingState";
import { useOnboardingTour } from "./useOnboardingTour";

const { startOnboardingTour, destroyActiveOnboardingTour } = vi.hoisted(() => ({
  startOnboardingTour: vi.fn().mockResolvedValue(true),
  destroyActiveOnboardingTour: vi.fn(),
}));

vi.mock("./onboardingTour", () => ({
  startOnboardingTour,
  destroyActiveOnboardingTour,
}));

const me = (resolved = false): MeResponse => ({
  id: "user-1",
  email: "person@example.test",
  username: "person",
  display_name: "Person",
  avatar_url: null,
  avatar_source: null,
  avatar_style: null,
  avatar_seed: null,
  onboarding_tour_version: resolved ? 1 : null,
  onboarding_tour_status: resolved ? "completed" : null,
  onboarding_tour_updated_at: resolved ? "2026-07-21T12:00:00Z" : null,
});

function wrapper(initialEntry = "/app") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const readyOptions = {
  me: me(),
  groupsReady: true,
  hasGroup: true,
  watchlistReady: true,
  watchlistCount: 3,
  blockingOverlayOpen: false,
};

describe("useOnboardingTour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }),
    );
  });

  it("launches once after authenticated application state is ready", async () => {
    const { rerender } = renderHook(() => useOnboardingTour(readyOptions), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(startOnboardingTour).toHaveBeenCalledTimes(1));
    rerender();
    expect(startOnboardingTour).toHaveBeenCalledTimes(1);
    expect(startOnboardingTour).toHaveBeenCalledWith(
      expect.objectContaining({ manual: false, hasGroup: true }),
    );
  });

  it("does not auto-launch for returning, dismissed, or auth-continuation users", async () => {
    window.sessionStorage.setItem(TOUR_SESSION_DISMISSED_KEY, "true");
    renderHook(
      () => useOnboardingTour({ ...readyOptions, me: me(true) }),
      { wrapper: wrapper("/app?auth=magic-link") },
    );
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    expect(startOnboardingTour).not.toHaveBeenCalled();
  });

  it("waits for a blocking overlay to close", async () => {
    const { rerender } = renderHook(
      (props) => useOnboardingTour(props),
      {
        wrapper: wrapper(),
        initialProps: { ...readyOptions, blockingOverlayOpen: true },
      },
    );
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    expect(startOnboardingTour).not.toHaveBeenCalled();

    rerender({ ...readyOptions, blockingOverlayOpen: false });
    await waitFor(() => expect(startOnboardingTour).toHaveBeenCalledTimes(1));
  });

  it("supports a manual no-group replay and destroys the loaded instance on cleanup", async () => {
    const { result, unmount } = renderHook(
      () =>
        useOnboardingTour({
          ...readyOptions,
          hasGroup: false,
          watchlistReady: false,
        }),
      { wrapper: wrapper() },
    );

    await result.current.replayTour(null);
    expect(startOnboardingTour).toHaveBeenCalledWith(
      expect.objectContaining({ manual: true, hasGroup: false }),
    );
    unmount();
    expect(destroyActiveOnboardingTour).toHaveBeenCalledWith(false);
  });
});
