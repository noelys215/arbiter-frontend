import type { DriveStep } from "driver.js";

export type OnboardingStepContext = {
  hasGroup: boolean;
  watchlistCount: number;
  isMobile: boolean;
  manual: boolean;
};

function isUsableTarget(element: HTMLElement | null) {
  if (!element || element.hidden || element.getClientRects().length === 0) {
    return false;
  }
  const styles = window.getComputedStyle(element);
  return styles.display !== "none" && styles.visibility !== "hidden";
}

function resolveTarget(name: string) {
  const direct = document.querySelector<HTMLElement>(
    `button[data-tour="${name}"], a[data-tour="${name}"]`,
  );
  if (isUsableTarget(direct)) return direct;

  const selectors: Record<string, string[]> = {
    "group-selector": ['[data-tour="group-selector"] button'],
    watchlist: ['[data-tour="watchlist-add"] button'],
    "watchlist-add": ['[data-tour="watchlist-add"] button'],
    friends: [
      '[data-tour="friends"] button:not(.app-danger-button)',
      'button[aria-label^="Open account menu"]',
    ],
    "create-group": ['[data-tour="create-group"] button'],
  };

  for (const selector of selectors[name] ?? []) {
    const element = document.querySelector<HTMLElement>(selector);
    if (isUsableTarget(element)) return element;
  }
  return null;
}

function targetedStep(
  name: string,
  title: string,
  description: string,
  side: "top" | "right" | "bottom" | "left",
  align: "start" | "center" | "end" = "center",
): DriveStep | null {
  const element = resolveTarget(name);
  if (!element) return null;
  return {
    element,
    popover: { title, description, side, align },
  };
}

export function buildOnboardingSteps(
  context: OnboardingStepContext,
): DriveStep[] {
  if (!context.hasGroup) {
    if (!context.manual) return [];
    const createStep = targetedStep(
      "create-group",
      "Start with a group",
      "Arbiter keeps each shared watchlist and movie night inside a group.",
      "bottom",
    );
    return [
      {
        popover: {
          title: "Welcome to Arbiter",
          description:
            "Create a movie-night group first, then build the shortlist together.",
          side: "bottom",
          align: "center",
        },
      },
      ...(createStep ? [createStep] : []),
    ];
  }

  const placement = context.isMobile ? "bottom" : "left";
  const steps = [
    targetedStep(
      "group-selector",
      "Your movie-night group",
      "Each group has its own shared watchlist, members, movie nights, and history.",
      "bottom",
      context.isMobile ? "center" : "end",
    ),
    targetedStep(
      context.watchlistCount === 0 ? "watchlist-add" : "watchlist",
      "Build the shortlist together",
      "Add the films everyone is considering. Arbiter makes the decision from your group’s own watchlist.",
      context.isMobile ? "bottom" : "right",
      "center",
    ),
    targetedStep(
      "friends",
      "Bring everyone in",
      "Invite friends once, then add them to groups whenever another movie night comes together.",
      placement,
      "center",
    ),
    context.watchlistCount >= 2
      ? targetedStep(
          "start-movie-night",
          "Decide together",
          "Set tonight’s mood, deal the deck, and vote in real time until the group has a winner.",
          "bottom",
          "center",
        )
      : null,
    targetedStep(
      "movie-nights",
      "Keep the memories",
      "Finished nights are saved here. Over time, Arbiter reveals the moods, genres, and habits that define your group.",
      placement,
      "center",
    ),
  ].filter((step): step is DriveStep => step !== null);

  return steps.slice(0, 5);
}
