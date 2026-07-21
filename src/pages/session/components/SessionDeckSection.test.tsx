import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef, type ComponentProps, type HTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SwipeDeckHandle } from "../../../components/SwipeDeck";
import type { CompletedSession } from "../../../features/sessions/sessions.api";
import SessionDeckSection from "./SessionDeckSection";

const motionState = vi.hoisted(() => ({ reduce: false }));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => motionState.reduce,
  motion: {
    div: ({ animate, transition, ...props }: HTMLAttributes<HTMLDivElement> & {
      animate?: unknown;
      transition?: unknown;
    }) => (
      <div
        {...props}
        data-motion={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
      />
    ),
  },
}));

vi.mock("../../../components/SwipeDeck", () => ({
  default: () => <div data-testid="swipe-deck" />,
}));

const winner = {
  watchlist_item_id: "candidate-1",
  position: 0,
  title: {
    id: "title-1",
    source: "manual",
    source_id: null,
    media_type: "movie",
    name: "The Feature",
    release_year: 2026,
    poster_path: null,
    overview: null,
    runtime_minutes: 100,
  },
};

function completedSession(
  watchedStatus: CompletedSession["watched_status"] = "unconfirmed",
): CompletedSession {
  return {
    session_id: "session-1",
    group_id: "group-1",
    group_name: "Match Club",
    status: "completed",
    created_at: "2026-07-20T00:00:00Z",
    started_at: "2026-07-20T00:00:01Z",
    winner_selected_at: "2026-07-20T00:05:00Z",
    completed_at: "2026-07-20T00:06:00Z",
    criteria: {},
    winner_candidate_id: "candidate-1",
    decision_duration_seconds: 299,
    winner_unanimous: true,
    had_tie: false,
    tie_resolution: "votes",
    watched_status: watchedStatus,
    watched_confirmed_at: null,
    teleparty_was_shared: false,
    teleparty_shared_at: null,
    teleparty_handoff_at: null,
    participants: [],
    candidates: [],
  };
}

function renderSection(
  overrides: Partial<ComponentProps<typeof SessionDeckSection>> = {},
) {
  const props: ComponentProps<typeof SessionDeckSection> = {
    deckSectionRef: createRef<HTMLDivElement>(),
    sessionPhase: "complete",
    sessionStatus: "winner_selected",
    winnerWatchlistItemId: winner.watchlist_item_id,
    tieBreakRequired: false,
    watchPartyUrl: null,
    watchPartyError: null,
    completion: null,
    completionError: null,
    showLeaderEndedCard: false,
    showPlaceholderDeck: false,
    showWaitingCard: false,
    stackCards: [winner],
    deckPhase: "ready",
    shuffleSeed: 0,
    swipeDeckRef: createRef<SwipeDeckHandle>(),
    currentIndex: 0,
    onCurrentIndexChange: vi.fn(),
    onSwipe: vi.fn(),
    canSwipe: false,
    canUndoSwipe: false,
    undoSwipeIsPending: false,
    sessionContext: { tags: [], moodSummary: "", aiWhy: null },
    localVotes: {},
    onUndoSwipe: vi.fn(),
    onProgrammaticSwipe: vi.fn(),
    swipedCount: 1,
    totalCards: 1,
    userSecondsLeft: 0,
    showShortlistButton: false,
    onOpenShortlist: vi.fn(),
    isGroupLeader: true,
    onShuffleWinner: vi.fn(),
    shuffleIsPending: false,
    watchPartyIsUpdating: false,
    onSetWatchPartyUrl: vi.fn(),
    onCompleteSession: vi.fn(),
    onWatchedStatus: vi.fn(),
    onWatchPartyHandoff: vi.fn(),
    completionIsPending: false,
    watchedStatusIsPending: false,
    sortedCardsLength: 1,
    isDeckComplete: false,
    onGoHome: vi.fn(),
    ...overrides,
  };
  render(<SessionDeckSection {...props} />);
  return props;
}

describe("SessionDeckSection completion lifecycle", () => {
  beforeEach(() => {
    motionState.reduce = false;
  });

  it("keeps the winner visible and offers idempotent completion", () => {
    const props = renderSection();
    expect(screen.getByText("Winner selected: The Feature.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish movie night" }));
    expect(props.onCompleteSession).toHaveBeenCalledOnce();
  });

  it("renders the persisted result and watched confirmation", () => {
    const props = renderSection({ completion: completedSession() });
    expect(screen.getByText("Movie night saved")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "We watched it" }));
    expect(props.onWatchedStatus).toHaveBeenCalledWith("watched");
  });

  it("keeps recoverable completion failures visible", () => {
    renderSection({ completionError: "We couldn’t save the movie night. Please try again." });
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t save");
  });

  it("removes transform motion when reduced motion is requested", () => {
    motionState.reduce = true;
    renderSection({ deckPhase: "revealingWinner" });
    expect(screen.getByTestId("swipe-deck").parentElement).toHaveAttribute(
      "data-motion",
      JSON.stringify({ x: 0, rotate: 0 }),
    );
  });

  it("only renders normalized Teleparty links", () => {
    renderSection({
      watchPartyUrl: "https://www.teleparty.com.attacker.example/join/bad",
    });
    expect(screen.queryByRole("link", { name: "Join Teleparty" })).toBeNull();
    cleanup();

    renderSection({
      watchPartyUrl: "https://www.teleparty.com/join/good",
    });
    expect(screen.getByRole("link", { name: "Join Teleparty" })).toHaveAttribute(
      "href",
      "https://www.teleparty.com/join/good",
    );
  });

  it("drops unapproved provider URLs while preserving valid providers", () => {
    renderSection({
      stackCards: [
        {
          ...winner,
          title: {
            ...winner.title,
            source: "tmdb",
            tmdb_streaming_options: [
              {
                provider_name: "Netflix",
                streaming_url: "https://www.netflix.com/title/123",
              },
              {
                provider_name: "Unsafe",
                streaming_url: "https://netflix.com.attacker.example/title/123",
              },
            ],
          },
        },
      ],
    });

    expect(screen.getByRole("link", { name: "Open Netflix" })).toHaveAttribute(
      "href",
      "https://www.netflix.com/title/123",
    );
    expect(screen.queryByRole("link", { name: "Open Unsafe" })).toBeNull();
    expect(
      screen.getByText("Unsafe").closest("span"),
    ).toHaveAttribute(
      "aria-label",
      "Unsafe (no direct streaming link available)",
    );
  });
});
