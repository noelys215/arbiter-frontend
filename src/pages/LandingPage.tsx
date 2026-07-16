import { useDisclosure } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import KoFiSupportLink from "../components/KoFiSupportLink";
import SkipLink from "../components/SkipLink";
import { feedbackAvailability } from "../config/appMetadata";
import FeedbackDialog from "../features/feedback/FeedbackDialog";
import LegalModal from "./components/LegalModal";

const pageCopy: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
    pageTitle: string;
  }
> = {
  "/movie-night-picker": {
    eyebrow: "Movie night picker",
    title: "Choose the movie together.",
    description:
      "Add a few options, invite your group, and vote. Arbiter brings the favorites forward so you can spend less time deciding and more time watching.",
    pageTitle: "Movie Night Picker for Groups | Arbiter",
  },
  "/watch-party-picker": {
    eyebrow: "Watch party picker",
    title: "A better way to start watch night.",
    description:
      "Arbiter gives everyone a simple vote and keeps the final choice clear for the whole group.",
    pageTitle: "Watch Party Picker | Arbiter",
  },
  "/how-it-works": {
    eyebrow: "How it works",
    title: "Three simple steps.",
    description:
      "Gather the ideas, vote together, and choose from the titles your group likes most.",
    pageTitle: "How Arbiter Works | Group Movie Voting",
  },
  "/about": {
    eyebrow: "About Arbiter",
    title: "A simple way to pick what to watch.",
    description:
      "Arbiter is for friends, roommates, couples, and watch parties that want an easier way to choose.",
    pageTitle: "About Arbiter | Group Movie Picker",
  },
};

const heroTitles = [
  {
    title: "Dune: Part Two",
    meta: "Film · 2024",
    tone: "from-[#c4874f] via-[#67412c] to-[#17100f]",
    status: "Most votes",
  },
  {
    title: "Severance",
    meta: "Series · 2022",
    tone: "from-[#3d6470] via-[#182c36] to-[#0c1114]",
    status: "Shortlisted",
  },
  {
    title: "Past Lives",
    meta: "Film · 2023",
    tone: "from-[#b9826d] via-[#56352f] to-[#140d0d]",
    status: "New",
  },
];

const steps = [
  {
    title: "Add the contenders",
    text: "Bring together the movies and shows everyone is considering.",
  },
  {
    title: "Invite your group",
    text: "Share one link and let everyone vote when they’re ready.",
  },
  {
    title: "Choose the favorite",
    text: "See what your group wants most and get movie night started.",
  },
];

const AUTH_CTA_LABEL = "Sign in";
type LegalModalKind = "privacy" | "data-deletion" | "credits";

export default function LandingPage() {
  const location = useLocation();
  const legalModal = useDisclosure();
  const feedbackModal = useDisclosure();
  const feedbackTriggerRef = useRef<HTMLButtonElement>(null);
  const [legalKind, setLegalKind] = useState<LegalModalKind>("privacy");
  const copy = pageCopy[location.pathname] ?? {
    eyebrow: "Made for movie night",
    title: "Movie night, decided together.",
    description:
      "Everyone gets a vote. Arbiter brings the favorites forward, so choosing takes minutes—not the whole night.",
    pageTitle: "Arbiter | Movie Night Picker for Groups",
  };

  useEffect(() => {
    document.title = copy.pageTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", copy.pageTitle);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", copy.description);
    document
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute("content", copy.pageTitle);
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute("content", copy.description);
  }, [copy.description, copy.pageTitle]);

  const openLegalModal = (kind: LegalModalKind) => {
    setLegalKind(kind);
    legalModal.onOpen();
  };

  return (
    <div className="landing-page">
      <SkipLink />
      <header className="landing-header">
        <nav className="landing-shell landing-nav" aria-label="Primary">
          <Link to="/" className="landing-brand" aria-label="Arbiter home">
            <img
              src="/arbiter.png"
              alt=""
              aria-hidden="true"
              className="landing-brand-mark"
            />
            <span className="landing-brand-wordmark">Arbiter</span>
          </Link>
          <div className="landing-nav-actions">
            <a href="#how-it-works" className="landing-secondary-action">
              How it works
            </a>
            <Link to="/login" className="landing-primary-action">
              {AUTH_CTA_LABEL}
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">{copy.eyebrow}</p>
              <h1 className="landing-heading-xl">{copy.title}</h1>
              <p className="landing-body-lg">{copy.description}</p>
              <div className="landing-hero-actions">
                <Link to="/login" className="landing-primary-action">
                  Create a movie night
                </Link>
                <a href="#how-it-works" className="landing-secondary-action">
                  See how it works
                </a>
              </div>
              <p className="landing-caption landing-auth-note">
                Continue with Google or email. No password needed.
              </p>
            </div>

            <div
              className="landing-product-scene"
              aria-label="Preview of Arbiter choosing a movie"
            >
              <div className="landing-product-light" aria-hidden="true" />
              <div className="landing-poster-rail" aria-hidden="true">
                {heroTitles.map((title) => (
                  <div
                    key={title.title}
                    className={`landing-poster-card bg-gradient-to-br ${title.tone}`}
                  >
                    <span>{title.title}</span>
                    <strong>{title.status}</strong>
                  </div>
                ))}
              </div>
              <div className="landing-product-frame">
                <div className="landing-product-topbar">
                  <div>
                    <p className="landing-product-kicker">Tonight’s session</p>
                    <p className="landing-product-name">Apartment 4B</p>
                  </div>
                  <span>Live</span>
                </div>
                <div className="landing-product-deck">
                  <div className="landing-feature-card">
                    <div className="landing-feature-poster bg-gradient-to-br from-[#c4874f] via-[#5d3828] to-[#120b09]">
                      <img src="/arbiter.png" alt="" aria-hidden="true" />
                    </div>
                    <div className="landing-feature-copy">
                      <p>Leading choice</p>
                      <p className="landing-feature-title">Dune: Part Two</p>
                      <span>4 yes votes · 1 still choosing</span>
                    </div>
                  </div>
                  <div className="landing-vote-row" aria-hidden="true">
                    <span>No</span>
                    <span>Undo</span>
                    <span>Yes</span>
                  </div>
                </div>
                <div className="landing-watchlist-preview">
                  {heroTitles.map((title) => (
                    <div key={title.title} className="landing-watchlist-row">
                      <div
                        className={`landing-watchlist-thumb bg-gradient-to-br ${title.tone}`}
                      />
                      <div>
                        <p>{title.title}</p>
                        <span>{title.meta}</span>
                      </div>
                      <strong>{title.status}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="landing-shell">
            <div className="landing-measure">
              <p className="landing-eyebrow">How it works</p>
              <h2 className="landing-heading-lg mt-3">
                One list. Every vote. One answer.
              </h2>
              <p className="landing-body mt-4">
                Add the options, invite your group, and watch the favorites
                rise.
              </p>
            </div>
            <div className="landing-process-grid">
              {steps.map((step, index) => (
                <article key={step.title} className="landing-process-step">
                  <p className="landing-step-number">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="landing-heading-md">{step.title}</h3>
                  <p className="landing-body">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-band landing-editorial-section">
          <div className="landing-shell landing-editorial-grid">
            <div className="landing-measure">
              <p className="landing-eyebrow">Built for the group</p>
              <h2 className="landing-heading-lg mt-3">
                See where the group is leaning.
              </h2>
              <p className="landing-body mt-4">
                Suggestions, votes, the leading choice, and the Teleparty link
                stay together in one quiet view. No side chats. No scattered
                lists. No guessing where the group stands.
              </p>
            </div>
            <div
              className="landing-editorial-product"
              aria-label="Preview of Arbiter group voting activity"
            >
              <div className="landing-activity-row">
                <span>Shared list</span>
                <div className="landing-activity-people" aria-hidden="true">
                  <span>H</span>
                  <span>M</span>
                  <span>A</span>
                </div>
                <strong>7 titles</strong>
              </div>
              <div className="landing-activity-title">
                <div className="landing-watchlist-thumb bg-gradient-to-br from-[#c4874f] via-[#67412c] to-[#17100f]" />
                <div>
                  <p>Dune: Part Two</p>
                  <span>Henry and Janeiry voted yes · Alex is choosing</span>
                </div>
                <strong className="landing-activity-pulse">Leading 4–1</strong>
              </div>
              <div className="landing-activity-title">
                <div className="landing-watchlist-thumb bg-gradient-to-br from-[#3d6470] via-[#182c36] to-[#0c1114]" />
                <div>
                  <p>Severance</p>
                  <span>Alex added this title · Sam voted yes</span>
                </div>
                <strong>2–2</strong>
              </div>
              <div className="landing-activity-footer">
                <span>Teleparty link ready when the group picks</span>
                <strong>Share link</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final-band landing-section-compact">
          <div className="landing-shell landing-final-grid">
            <div className="landing-measure">
              <h2 className="landing-final-title">A quieter way to choose.</h2>
              <p className="landing-final-body">
                Less scrolling. Less debating. More time for the movie.
              </p>
            </div>
            <Link to="/login" className="landing-final-action">
              Create a movie night
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-section-compact text-sm text-[var(--landing-text-secondary)]">
        <div className="landing-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Arbiter™. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <KoFiSupportLink />
            {feedbackAvailability.public ? (
              <button
                ref={feedbackTriggerRef}
                type="button"
                className="landing-text-link"
                onClick={feedbackModal.onOpen}
              >
                Feedback
              </button>
            ) : null}
            <button
              type="button"
              className="landing-text-link"
              onClick={() => openLegalModal("privacy")}
            >
              Privacy
            </button>
            <button
              type="button"
              className="landing-text-link"
              onClick={() => openLegalModal("data-deletion")}
            >
              Data deletion
            </button>
            <button
              type="button"
              className="landing-text-link"
              onClick={() => openLegalModal("credits")}
            >
              Credits
            </button>
          </div>
        </div>
      </footer>

      <LegalModal
        kind={legalKind}
        isOpen={legalModal.isOpen}
        onOpenChange={legalModal.onOpenChange}
        onSwitchKind={setLegalKind}
      />
      {feedbackAvailability.public ? (
        <FeedbackDialog
          isOpen={feedbackModal.isOpen}
          onOpenChange={feedbackModal.onOpenChange}
          source="landing_footer"
          returnFocusRef={feedbackTriggerRef}
        />
      ) : null}
    </div>
  );
}
