import { afterEach, describe, expect, it } from "vitest";
import { buildOnboardingSteps } from "./onboardingSteps";

function addTarget(name: string, disabled = false) {
  const element = document.createElement("button");
  element.dataset.tour = name;
  element.disabled = disabled;
  Object.defineProperty(element, "getClientRects", {
    value: () => [{ width: 100, height: 44 }],
  });
  document.body.append(element);
  return element;
}

describe("onboarding step generation", () => {
  afterEach(() => document.body.replaceChildren());

  it("builds the five-step desktop mental model when every target is ready", () => {
    [
      "group-selector",
      "watchlist",
      "friends",
      "start-movie-night",
      "movie-nights",
    ].forEach((name) => addTarget(name));

    const steps = buildOnboardingSteps({
      hasGroup: true,
      watchlistCount: 3,
      isMobile: false,
      manual: false,
    });

    expect(steps).toHaveLength(5);
    expect(steps.map((step) => step.popover?.title)).toEqual([
      "Your movie-night group",
      "Build the shortlist together",
      "Bring everyone in",
      "Decide together",
      "Keep the memories",
    ]);
  });

  it("uses the add-title target and omits an unavailable start action", () => {
    ["group-selector", "watchlist-add", "friends", "movie-nights"].forEach(
      (name) => addTarget(name),
    );
    const steps = buildOnboardingSteps({
      hasGroup: true,
      watchlistCount: 0,
      isMobile: true,
      manual: false,
    });
    expect(steps).toHaveLength(4);
    expect(steps.some((step) => step.popover?.title === "Decide together")).toBe(
      false,
    );
    expect(steps[1]?.element).toBeInstanceOf(HTMLButtonElement);
    expect((steps[1]?.element as HTMLElement).dataset.tour).toBe(
      "watchlist-add",
    );
  });

  it("filters missing targets without exceeding the maximum step count", () => {
    addTarget("group-selector");
    addTarget("movie-nights");
    const steps = buildOnboardingSteps({
      hasGroup: true,
      watchlistCount: 4,
      isMobile: false,
      manual: false,
    });
    expect(steps).toHaveLength(2);
    expect(steps.length).toBeLessThanOrEqual(5);
  });

  it("defers automatic no-group guidance but supports a short manual replay", () => {
    addTarget("create-group");
    expect(
      buildOnboardingSteps({
        hasGroup: false,
        watchlistCount: 0,
        isMobile: false,
        manual: false,
      }),
    ).toEqual([]);
    expect(
      buildOnboardingSteps({
        hasGroup: false,
        watchlistCount: 0,
        isMobile: false,
        manual: true,
      }),
    ).toHaveLength(2);
  });
});
