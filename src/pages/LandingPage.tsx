import { Button } from "@heroui/react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandLockup from "../components/BrandLockup";
import SkipLink from "../components/SkipLink";

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

const searchTargets = [
  "movie night picker",
  "group movie picker",
  "watch party picker",
  "movie voting app",
  "what should we watch",
];

export default function LandingPage() {
  const location = useLocation();
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
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to="/login"
              variant="bordered"
              className="border-[#E0B15C]/45 text-[#F5D9A5]"
            >
              Login
            </Button>
            <Button
              as={Link}
              to="/register"
              className="border border-[#E0B15C]/60 bg-[#E0B15C] text-[#1C110F]"
            >
              Start
            </Button>
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden px-5 pb-14 pt-32 sm:px-8 sm:pb-18">
          <img
            src="/arbiter.png"
            alt=""
            aria-hidden="true"
            className="absolute right-[-4rem] top-24 z-[-1] w-[min(80vw,46rem)] opacity-20 blur-[1px] sm:right-[4vw] sm:top-20 sm:opacity-25"
          />
          <div className="absolute inset-0 z-[-2] bg-[linear-gradient(180deg,rgba(20,12,10,0.22)_0%,rgba(20,12,10,0.78)_58%,#140C0A_100%)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.7fr)] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#E0B15C]">
                {copy.eyebrow}
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-[#F5D9A5] sm:text-7xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#D9C7A8] sm:text-xl">
                {copy.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  as={Link}
                  to="/register"
                  size="lg"
                  className="border border-[#E0B15C]/60 bg-[#E0B15C] text-[#1C110F]"
                >
                  Create a group
                </Button>
                <Button
                  as={Link}
                  to="/login"
                  size="lg"
                  variant="bordered"
                  className="border-[#E0B15C]/45 text-[#F5D9A5]"
                >
                  Open Arbiter
                </Button>
              </div>
            </div>

            <div className="hidden border-l border-[#E0B15C]/25 pl-8 lg:block">
              <p className="text-sm uppercase tracking-[0.2em] text-[#E0B15C]/80">
                Built for
              </p>
              <ul className="mt-4 space-y-3 text-lg text-[#F7F1E3]">
                <li>Friday movie nights</li>
                <li>Remote watch parties</li>
                <li>Roommate watchlists</li>
                <li>Friend group sessions</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E0B15C]/15 bg-[#1C110F] px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
            {searchTargets.map((target) => (
              <span
                key={target}
                className="rounded-full border border-[#E0B15C]/25 px-4 py-2 text-sm text-[#D9C7A8]"
              >
                {target}
              </span>
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
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Ready to settle the next watch night?
              </h2>
              <p className="mt-3 text-base leading-7 text-[#4C3329]">
                Create a group, add a few titles, and let Arbiter turn the
                decision into a quick live vote.
              </p>
            </div>
            <Button
              as={Link}
              to="/register"
              size="lg"
              className="w-full bg-[#1C110F] text-[#F7F1E3] md:w-auto"
            >
              Start a session
            </Button>
          </div>
        </section>
      </main>

      <footer className="px-5 py-8 text-sm text-[#D9C7A8] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <span>Arbiter</span>
          <div className="flex gap-4">
            <Link className="text-[#F5D9A5]" to="/privacy">
              Privacy
            </Link>
            <Link className="text-[#F5D9A5]" to="/data-deletion">
              Data deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
