import { Button, Card, CardBody, CardHeader, Chip, Divider, useDisclosure } from "@heroui/react";
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
    title: "Finally pick a movie everyone can agree on.",
    description:
      "Add a few movies, invite your people, and let everyone vote. Arbiter shows you the best options so movie night can actually start.",
    pageTitle: "Movie Night Picker for Groups | Arbiter",
  },
  "/watch-party-picker": {
    eyebrow: "Watch party picker",
    title: "Stop asking “what should we watch?”",
    description:
      "Arbiter helps your group make a quick choice, then keeps everyone on the same page with the final pick.",
    pageTitle: "Watch Party Picker | Arbiter",
  },
  "/how-it-works": {
    eyebrow: "How it works",
    title: "Three easy steps. No arguing required.",
    description:
      "Put the movie ideas in one place, vote as a group, and use the shortlist to choose what to watch.",
    pageTitle: "How Arbiter Works | Group Movie Voting",
  },
  "/about": {
    eyebrow: "About Arbiter",
    title: "A simple way to pick what to watch.",
    description:
      "Arbiter is for friends, roommates, couples, and watch parties that are tired of scrolling forever.",
    pageTitle: "About Arbiter | Group Movie Picker",
  },
};

const steps = [
  {
    title: "Add choices",
    text: "Put the movies and shows your group is considering into one shared list.",
  },
  {
    title: "Everyone votes",
    text: "Each person says yes or no. No long debate, no messy text thread.",
  },
  {
    title: "Choose the winner",
    text: "Arbiter narrows the list so your group can start watching sooner.",
  },
];

const useCases = [
  "Friends",
  "Roommates",
  "Couples",
  "Watch parties",
  "Family movie night",
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
      "A simple app that helps groups pick what movie or show to watch next.",
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
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#E0B15C]">
                {copy.eyebrow}
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] text-[#F5D9A5] sm:text-7xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#D9C7A8] sm:text-xl">
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
                  Use Google or a magic link. No password needed.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2" aria-label="Common groups that use Arbiter">
                {useCases.map((target) => (
                  <Chip
                    key={target}
                    variant="flat"
                    classNames={{
                      base: "bg-[#E0B15C]/16",
                      content: "text-[#F5D9A5]",
                    }}
                  >
                    {target}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#E0B15C]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#F5D9A5] sm:text-5xl">
                You do not need to learn anything new.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#D9C7A8]">
                If you can add a movie and tap yes or no, you can use Arbiter.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card
                  key={step.title}
                  className="border border-[#E0B15C]/20 bg-[#1C110F] shadow-none"
                >
                  <CardHeader className="flex items-start gap-4 px-5 pt-5">
                    <Chip
                      variant="flat"
                      classNames={{
                        base: "bg-[#E0B15C]/18",
                        content: "font-semibold text-[#F5D9A5]",
                      }}
                    >
                      {index + 1}
                    </Chip>
                    <div>
                      <h3 className="text-xl font-semibold text-[#F7F1E3]">
                        {step.title}
                      </h3>
                    </div>
                  </CardHeader>
                  <CardBody className="px-5 pb-5 pt-1">
                    <p className="leading-7 text-[#D9C7A8]">{step.text}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#E0B15C]/15 bg-[#1C110F] px-5 py-14 sm:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
            <Card className="border border-[#E0B15C]/20 bg-[#140C0A] shadow-none">
              <CardBody className="gap-3 p-5">
                <h2 className="text-xl font-semibold text-[#F5D9A5]">
                  For the person hosting
                </h2>
                <Divider className="bg-[#E0B15C]/15" />
                <p className="leading-7 text-[#D9C7A8]">
                  Add the options once. Everyone votes from the same list.
                </p>
              </CardBody>
            </Card>
            <Card className="border border-[#E0B15C]/20 bg-[#140C0A] shadow-none">
              <CardBody className="gap-3 p-5">
                <h2 className="text-xl font-semibold text-[#F5D9A5]">
                  For the picky friend
                </h2>
                <Divider className="bg-[#E0B15C]/15" />
                <p className="leading-7 text-[#D9C7A8]">
                  Vote no when you are not feeling it. Vote yes when you are.
                </p>
              </CardBody>
            </Card>
            <Card className="border border-[#E0B15C]/20 bg-[#140C0A] shadow-none">
              <CardBody className="gap-3 p-5">
                <h2 className="text-xl font-semibold text-[#F5D9A5]">
                  For everyone else
                </h2>
                <Divider className="bg-[#E0B15C]/15" />
                <p className="leading-7 text-[#D9C7A8]">
                  Stop scrolling, stop debating, and start the movie.
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="bg-[#F7F1E3] px-5 py-16 text-[#1C110F] sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Movie night should not take all night to start.
              </h2>
              <p className="mt-3 text-base leading-7 text-[#4C3329]">
                Sign in, add your group, and let Arbiter handle the deciding.
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
