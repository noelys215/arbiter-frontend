import { Button, Chip, useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import SkipLink from "../components/SkipLink";
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
    title: "Pick what to watch without the group chat spiral.",
    description:
      "Arbiter turns movie night into a fast group vote, then narrows everyone down to a title people actually want to watch.",
    pageTitle: "Movie Night Picker for Groups | Arbiter",
  },
  "/watch-party-picker": {
    eyebrow: "Watch party picker",
    title: "Get the watch party aligned before the trailers start.",
    description:
      "Build a shared watchlist, swipe through options together, and send the final watch link to the group in real time.",
    pageTitle: "Watch Party Picker | Arbiter",
  },
  "/how-it-works": {
    eyebrow: "How it works",
    title: "Add the options, start a session, let the group decide.",
    description:
      "Arbiter keeps the process simple: collect titles, vote yes or no, undo mistakes, and finish with a shortlist or winner.",
    pageTitle: "How Arbiter Works | Group Movie Voting",
  },
  "/about": {
    eyebrow: "About Arbiter",
    title: "A calmer way to decide what the group is watching.",
    description:
      "Arbiter is built for friend groups, roommates, and watch parties that need a better answer than endless recommendations.",
    pageTitle: "About Arbiter | Group Movie Picker",
  },
};

const steps = [
  {
    title: "Build a shared watchlist",
    text: "Add movies and shows from search or manual entry so every suggestion lives in one place.",
  },
  {
    title: "Start a live session",
    text: "Everyone votes from the same group session, with updates landing in real time.",
  },
  {
    title: "Pick and watch",
    text: "Use the shortlist, winner reveal, and watch-party link to move from deciding to watching.",
  },
];

const featureStats = [
  { label: "Live sessions", value: "real-time" },
  { label: "Vote options", value: "yes / no" },
  { label: "Auth", value: "OAuth + magic links" },
];

const searchTargets = [
  "movie night picker",
  "group movie picker",
  "watch party picker",
  "movie voting app",
  "what should we watch",
];

const AUTH_CTA_LABEL = "Sign in";
type LegalModalKind = "privacy" | "data-deletion";

export default function LandingPage() {
  const location = useLocation();
  const legalModal = useDisclosure();
  const [legalKind, setLegalKind] = useState<LegalModalKind>("privacy");
  const copy = pageCopy[location.pathname] ?? {
    eyebrow: "Group movie picker",
    title: "Arbiter",
    description:
      "A shared watchlist and live voting app that helps groups decide what movie or show to watch next.",
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
    <div className="min-h-screen bg-[#140C0A] text-[#F7F1E3]">
      <SkipLink />
      <header className="absolute left-0 right-0 top-0 z-20">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8"
          aria-label="Primary"
        >
          <BrandLockup
            showVersion={false}
            logoClassName="h-10 w-10 sm:h-12 sm:w-12"
            titleClassName="text-3xl sm:text-4xl"
          />
          <Button
            as={Link}
            to="/login"
            className="min-h-11 border border-[#E0B15C]/60 bg-[#E0B15C] px-5 text-[#1C110F]"
          >
            {AUTH_CTA_LABEL}
          </Button>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden px-5 pb-14 pt-32 sm:px-8 sm:pb-18">
          <img
            src="/arbiter.png"
            alt=""
            aria-hidden="true"
            className="absolute right-[-5rem] top-24 z-[-1] w-[min(78vw,42rem)] opacity-[0.18] sm:right-[3vw] sm:top-[4.5rem] sm:opacity-25"
          />
          <div className="absolute inset-0 z-[-2] bg-[linear-gradient(180deg,rgba(20,12,10,0.1)_0%,rgba(20,12,10,0.8)_62%,#140C0A_100%)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.78fr)] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#E0B15C]">
                {copy.eyebrow}
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] text-[#F5D9A5] sm:text-7xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#D9C7A8] sm:text-xl">
                {copy.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  as={Link}
                  to="/login"
                  size="lg"
                  className="min-h-12 border border-[#E0B15C]/60 bg-[#E0B15C] px-7 text-base text-[#1C110F]"
                >
                  {AUTH_CTA_LABEL}
                </Button>
                <p className="max-w-xs text-sm leading-6 text-[#D9C7A8]">
                  Continue with Google or request a secure magic link. No
                  passwords to create or manage.
                </p>
              </div>
            </div>

            <div className="border border-[#E0B15C]/18 bg-[#1C110F]/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-[#E0B15C]/15 pb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#E0B15C]/80">
                    Tonight's session
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#F7F1E3]">
                    Movie night, settled
                  </h2>
                </div>
                <Chip
                  variant="flat"
                  classNames={{
                    base: "bg-[#E0B15C]/18",
                    content: "text-[#F5D9A5]",
                  }}
                >
                  Live
                </Chip>
              </div>
              <dl className="mt-5 grid gap-3">
                {featureStats.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-[#E0B15C]/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-sm text-[#D9C7A8]">{item.label}</dt>
                    <dd className="text-sm font-semibold text-[#F5D9A5]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden="true">
                {["No", "Undo", "Yes"].map((label) => (
                  <div
                    key={label}
                    className="border border-[#E0B15C]/18 bg-[#140C0A] px-3 py-3 text-center text-sm font-semibold text-[#F7F1E3]"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E0B15C]/15 bg-[#1C110F] px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
            {searchTargets.map((target) => (
              <Chip
                key={target}
                variant="bordered"
                classNames={{
                  base: "border-[#E0B15C]/25",
                  content: "text-[#D9C7A8]",
                }}
              >
                {target}
              </Chip>
            ))}
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#E0B15C]">
                How Arbiter helps
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#F5D9A5] sm:text-5xl">
                Less debating. More watching.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="border-t border-[#E0B15C]/30 pt-5"
                >
                  <span className="text-sm font-semibold text-[#E0B15C]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-[#F7F1E3]">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#D9C7A8]">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F7F1E3] px-5 py-16 text-[#1C110F] sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Ready to settle the next watch night?
              </h2>
              <p className="mt-3 text-base leading-7 text-[#4C3329]">
                Sign in with Google or a magic link, add a few titles, and let
                Arbiter turn the decision into a quick live vote.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 py-8 text-sm text-[#D9C7A8] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Arbiter™. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <button
              type="button"
              className="min-h-11 text-[#F5D9A5] underline-offset-4 hover:underline"
              onClick={() => openLegalModal("privacy")}
            >
              Privacy
            </button>
            <button
              type="button"
              className="min-h-11 text-[#F5D9A5] underline-offset-4 hover:underline"
              onClick={() => openLegalModal("data-deletion")}
            >
              Data deletion
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
    </div>
  );
}
