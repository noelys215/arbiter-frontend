import type { Driver } from "driver.js";
import { buildOnboardingSteps, type OnboardingStepContext } from "./onboardingSteps";

type TourDisposition = "completed" | "skipped" | "dismissed";

type StartTourOptions = OnboardingStepContext & {
  onDisposition: (disposition: TourDisposition) => void;
  restoreFocusTo?: HTMLElement | null;
};

let activeDriver: Driver | null = null;
let activeStart: Promise<boolean> | null = null;

function restoreFocus(preferred?: HTMLElement | null) {
  window.requestAnimationFrame(() => {
    const fallback = document.querySelector<HTMLElement>(
      '[data-tour="group-selector"] button, #main-content',
    );
    const destination = preferred?.isConnected ? preferred : fallback;
    destination?.focus({ preventScroll: true });
  });
}

export function destroyActiveOnboardingTour(shouldRestoreFocus = false) {
  const driver = activeDriver;
  activeDriver = null;
  if (driver?.isActive()) driver.destroy();
  if (shouldRestoreFocus) restoreFocus();
}

export function isOnboardingTourActive() {
  return Boolean(activeDriver?.isActive());
}

export async function startOnboardingTour(options: StartTourOptions) {
  if (activeDriver?.isActive()) return false;
  if (activeStart) return activeStart;

  activeStart = (async () => {
    const steps = buildOnboardingSteps(options);
    if (steps.length === 0) return false;

    const [{ driver }] = await Promise.all([
      import("driver.js"),
      import("driver.js/dist/driver.css"),
      import("./onboardingTour.css"),
    ]);
    if (activeDriver?.isActive()) return false;

    let disposition: TourDisposition = "dismissed";
    const focusBeforeTour =
      options.restoreFocusTo ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    const trapPopoverFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const popover = document.querySelector<HTMLElement>(
        ".arbiter-tour-popover",
      );
      if (!popover) return;
      const controls = Array.from(
        popover.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((control) => control.getClientRects().length > 0);
      if (controls.length === 0) return;
      const currentIndex = controls.indexOf(
        document.activeElement as HTMLElement,
      );
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? controls.length - 1
          : currentIndex - 1
        : currentIndex < 0 || currentIndex === controls.length - 1
          ? 0
          : currentIndex + 1;
      event.preventDefault();
      controls[nextIndex]?.focus();
    };
    const instance = driver({
      steps,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      duration: 240,
      overlayColor: "#080403",
      overlayOpacity: 0.68,
      smoothScroll: true,
      allowClose: true,
      allowScroll: true,
      overlayClickBehavior: () => instance.destroy(),
      allowKeyboardControl: true,
      disableActiveInteraction: true,
      skipMissingElement: true,
      waitForElement: 500,
      stagePadding: 8,
      stageRadius: 8,
      popoverOffset: 12,
      popoverClass: "arbiter-tour-popover",
      showButtons: ["previous", "next", "close"],
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      prevBtnText: "Back",
      nextBtnText: "Next",
      doneBtnText: "Finish",
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute("aria-label", "Close tour");
        popover.wrapper.setAttribute("aria-live", "polite");
        const heading = document.createElement("h2");
        heading.id = "arbiter-tour-title";
        heading.tabIndex = -1;
        heading.textContent = popover.title.textContent;
        popover.title.setAttribute("role", "presentation");
        popover.title.replaceChildren(heading);
        popover.footer.setAttribute("role", "presentation");
        popover.description.id = "arbiter-tour-description";
        popover.wrapper.setAttribute("aria-labelledby", heading.id);
        popover.wrapper.setAttribute(
          "aria-describedby",
          popover.description.id,
        );
        // Driver focuses the first control (Close) after this callback. Move
        // focus to the heading before paint so the dialog opens without a
        // misleading action focus while still announcing its content.
        window.queueMicrotask(() => {
          if (heading.isConnected) heading.focus({ preventScroll: true });
        });
        if (!popover.footerButtons.querySelector(".arbiter-tour-skip")) {
          const skip = document.createElement("button");
          skip.type = "button";
          skip.className = "arbiter-tour-skip";
          skip.textContent = "Skip tour";
          skip.addEventListener("click", () => {
            disposition = "skipped";
            instance.destroy();
          });
          popover.footerButtons.prepend(skip);
        }
      },
      onNextClick: () => instance.moveNext(),
      onPrevClick: () => instance.movePrevious(),
      onCloseClick: () => instance.destroy(),
      onDoneClick: () => {
        disposition = "completed";
        instance.destroy();
      },
      onDestroyed: () => {
        document.removeEventListener("keydown", trapPopoverFocus, true);
        if (activeDriver === instance) activeDriver = null;
        options.onDisposition(disposition);
        restoreFocus(focusBeforeTour);
      },
    });

    document.addEventListener("keydown", trapPopoverFocus, true);
    activeDriver = instance;
    instance.drive();
    return true;
  })().finally(() => {
    activeStart = null;
  });

  return activeStart;
}
