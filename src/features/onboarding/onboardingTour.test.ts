import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  destroyActiveOnboardingTour,
  startOnboardingTour,
} from "./onboardingTour";

function addTourTarget(name: string) {
  const target = document.createElement("button");
  target.dataset.tour = name;
  Object.defineProperty(target, "getClientRects", {
    value: () => [{ width: 120, height: 44 }],
  });
  document.body.append(target);
}

describe("onboarding tour focus", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }),
    );
    addTourTarget("group-selector");
  });

  afterEach(() => {
    destroyActiveOnboardingTour();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it("opens on the dialog heading instead of the close action", async () => {
    await startOnboardingTour({
      hasGroup: true,
      watchlistCount: 0,
      isMobile: false,
      manual: false,
      onDisposition: vi.fn(),
    });
    await Promise.resolve();

    expect(document.activeElement).toBe(
      document.querySelector("#arbiter-tour-title"),
    );
    expect(document.activeElement).not.toBe(
      document.querySelector(".driver-popover-close-btn"),
    );
  });
});
