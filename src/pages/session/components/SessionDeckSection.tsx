import { Button, Card, CardBody } from "@heroui/react";
import { motion } from "framer-motion";
import type { RefObject } from "react";
import SwipeDeck, {
  type SwipeDeckHandle,
  type SwipeDirection,
} from "../../../components/SwipeDeck";
import type { SessionCandidate } from "../../../features/sessions/sessions.api";
import type { DeckPhase } from "../animations";
import type { SessionContext, SwipeVote } from "../types";
import { buildWhyLine, getReadableVote } from "../utils";
import {
  DeckPlaceholderStack,
  LeaderEndedCard,
  TieBreakCard,
  WaitingForOthersCard,
} from "./DeckOverlays";
import SessionDeckCard from "./SessionDeckCard";

type StreamingOption = {
  provider_name: string;
  streaming_url: string | null;
};

function normalizeStreamingOptions(raw: unknown): StreamingOption[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: StreamingOption[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const maybeName =
      "provider_name" in entry ? (entry.provider_name as string) : "";
    const maybeUrl =
      "streaming_url" in entry ? (entry.streaming_url as string | null) : null;

    const name = typeof maybeName === "string" ? maybeName.trim() : "";
    if (!name) continue;

    const url =
      typeof maybeUrl === "string" && maybeUrl.trim().length > 0
        ? maybeUrl.trim()
        : null;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ provider_name: name, streaming_url: url });
  }
  return out;
}

type SessionDeckSectionProps = {
  deckSectionRef: RefObject<HTMLDivElement | null>;
  sessionPhase: string;
  sessionStatus: string;
  winnerWatchlistItemId: string | null;
  tieBreakRequired: boolean;
  showLeaderEndedCard: boolean;
  showPlaceholderDeck: boolean;
  showWaitingCard: boolean;
  stackCards: SessionCandidate[];
  deckPhase: DeckPhase;
  shuffleSeed: number;
  swipeDeckRef: RefObject<SwipeDeckHandle | null>;
  currentIndex: number;
  onCurrentIndexChange: (index: number) => void;
  onSwipe: (direction: SwipeDirection, card: SessionCandidate) => void;
  canSwipe: boolean;
  sessionContext: SessionContext;
  localVotes: Record<string, SwipeVote>;
  onProgrammaticSwipe: (direction: "left" | "up" | "right") => Promise<void>;
  swipedCount: number;
  totalCards: number;
  userSecondsLeft: number;
  showShortlistButton: boolean;
  onOpenShortlist: () => void;
  isGroupLeader: boolean;
  onShuffleWinner: () => Promise<void>;
  shuffleIsPending: boolean;
  sortedCardsLength: number;
  isDeckComplete: boolean;
  onGoHome: () => void;
};

export default function SessionDeckSection({
  deckSectionRef,
  sessionPhase,
  sessionStatus,
  winnerWatchlistItemId,
  tieBreakRequired,
  showLeaderEndedCard,
  showPlaceholderDeck,
  showWaitingCard,
  stackCards,
  deckPhase,
  shuffleSeed,
  swipeDeckRef,
  currentIndex,
  onCurrentIndexChange,
  onSwipe,
  canSwipe,
  sessionContext,
  localVotes,
  onProgrammaticSwipe,
  swipedCount,
  totalCards,
  userSecondsLeft,
  showShortlistButton,
  onOpenShortlist,
  isGroupLeader,
  onShuffleWinner,
  shuffleIsPending,
  sortedCardsLength,
  isDeckComplete,
  onGoHome,
}: SessionDeckSectionProps) {
  const winnerCard = winnerWatchlistItemId
    ? stackCards.find((card) => card.watchlist_item_id === winnerWatchlistItemId) ?? null
    : null;
  const isTmdbWinner = winnerCard?.title.source === "tmdb";
  const winnerStreamingOptions = normalizeStreamingOptions(
    winnerCard?.title.tmdb_streaming_options,
  );

  return (
    <section ref={deckSectionRef} className="space-y-4">
      <div className="flex items-end justify-center">
        <div className="w-full">
          <p className="session-title-micro text-left text-xs text-[#E0B15C]/65">
            Deck
          </p>
          <h3 className="text-center text-xl text-[#F5D9A5]">
            {showLeaderEndedCard
              ? "Leader has ended the session."
              : winnerWatchlistItemId
                ? "And now… the feature presentation."
                : sessionPhase === "swiping"
                  ? "Swipe through the shared group deck"
                  : tieBreakRequired
                    ? "Judgment remains divided"
                    : "The stage is set. We await the cast."}
          </h3>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[540px] flex-col items-center gap-4">
        <div className="relative h-[510px] w-full">
          {showPlaceholderDeck ? (
            <div className="absolute inset-0">
              <DeckPlaceholderStack deckPhase={deckPhase} shuffleSeed={shuffleSeed} />
            </div>
          ) : null}
          {showWaitingCard ? <WaitingForOthersCard /> : null}
          {showLeaderEndedCard ? <LeaderEndedCard onGoHome={onGoHome} /> : null}
          {tieBreakRequired ? <TieBreakCard isGroupLeader={isGroupLeader} /> : null}
          {stackCards.length > 0 && !showWaitingCard ? (
            <motion.div
              className="absolute inset-0"
              animate={
                deckPhase === "shuffling" || deckPhase === "revealingWinner"
                  ? {
                      x: [0, -8, 8, -6, 6, 0],
                      rotate: [0, -1.3, 1.1, -0.8, 0.8, 0],
                    }
                  : { x: 0, rotate: 0 }
              }
              transition={{ duration: 0.72, ease: "easeInOut" }}
            >
              <SwipeDeck
                ref={swipeDeckRef}
                cards={stackCards}
                getCardId={(card) => card.watchlist_item_id}
                currentIndex={currentIndex}
                onCurrentIndexChange={onCurrentIndexChange}
                onSwipe={onSwipe}
                canSwipe={canSwipe}
                className="absolute inset-0"
                renderCard={({ card, index, isTopCard, isVisibleCard }) => {
                  const whyLine = buildWhyLine(card, sessionContext);
                  const vote = localVotes[card.watchlist_item_id];
                  const isWinner = winnerWatchlistItemId === card.watchlist_item_id;
                  const voteLabel = getReadableVote(vote);

                  return (
                    <SessionDeckCard
                      card={card}
                      index={index}
                      isTopCard={isTopCard}
                      isVisibleCard={isVisibleCard}
                      isWinner={isWinner}
                      whyLine={whyLine}
                      voteLabel={voteLabel}
                    />
                  );
                }}
              />
            </motion.div>
          ) : null}
        </div>

        <div className="flex w-full items-center justify-center gap-2">
          <Button
            variant="bordered"
            className="border-[#D77B69]/45 text-[#F1A799]"
            isDisabled={!canSwipe}
            onPress={() => {
              void onProgrammaticSwipe("left");
            }}
          >
            No
          </Button>
          <Button
            variant="bordered"
            className="border-[#E0B15C]/45 text-[#E0B15C]"
            isDisabled={!canSwipe}
            onPress={() => {
              void onProgrammaticSwipe("up");
            }}
          >
            Maybe
          </Button>
          <Button
            className="border border-[#E0B15C]/55 bg-[#E0B15C] text-[#171717]"
            isDisabled={!canSwipe}
            onPress={() => {
              void onProgrammaticSwipe("right");
            }}
          >
            Yes
          </Button>
        </div>

        <div className="flex w-full items-center justify-between text-xs text-[#D9C7A8]">
          <div className="flex flex-col">
            <span>
              {Math.max(0, swipedCount)} / {Math.max(0, totalCards)}
            </span>
            {sessionStatus === "active" ? (
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#E0B15C]/75">
                {sessionPhase === "swiping"
                  ? `Swipe Timer · ${userSecondsLeft}s`
                  : "Setup · Waiting For Confirmations"}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {showShortlistButton ? (
              <Button
                size="sm"
                variant="bordered"
                className="border-[#E0B15C]/45 text-[#E0B15C]"
                onPress={onOpenShortlist}
              >
                View Shortlist
              </Button>
            ) : null}
            {tieBreakRequired && isGroupLeader ? (
              <Button
                size="sm"
                variant="bordered"
                className="border-[#E0B15C]/45 text-[#E0B15C]"
                isLoading={shuffleIsPending || deckPhase === "revealingWinner"}
                isDisabled={sortedCardsLength === 0}
                onPress={() => {
                  void onShuffleWinner();
                }}
              >
                Shuffle Winner
              </Button>
            ) : null}
          </div>
        </div>

        {winnerCard && isTmdbWinner ? (
          <Card className="w-full border border-[#E0B15C]/25 bg-[#22130F]">
            <CardBody className="flex flex-col gap-3">
              <p className="session-title-micro text-xs text-[#E0B15C]/65">
                Streaming
              </p>
              {winnerStreamingOptions.length > 0 ? (
                <>
                  <p className="text-sm text-[#E8E8E8]">
                    {winnerStreamingOptions.length === 1
                      ? `Stream on ${winnerStreamingOptions[0].provider_name}.`
                      : `Streaming options for ${winnerCard.title.name}.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {winnerStreamingOptions.map((provider) =>
                      provider.streaming_url ? (
                        <a
                          key={provider.provider_name}
                          href={provider.streaming_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-[#E0B15C]/45 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#E0B15C] transition-colors hover:border-[#E0B15C]/75 hover:text-[#F5D9A5]"
                        >
                          {provider.provider_name}
                        </a>
                      ) : (
                        <span
                          key={provider.provider_name}
                          className="rounded-md border border-[#E0B15C]/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#E0B15C]/80"
                        >
                          {provider.provider_name}
                        </span>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#E8E8E8]">
                  No streaming providers found right now.
                </p>
              )}
            </CardBody>
          </Card>
        ) : null}

        {isDeckComplete && !showWaitingCard && sessionPhase === "swiping" ? (
          <Card className="w-full border border-[#E0B15C]/25 bg-[#22130F]">
            <CardBody className="flex flex-col gap-3">
              <p className="session-title-micro text-xs text-[#E0B15C]/65">
                Deck complete
              </p>
              <p className="text-sm text-[#E8E8E8]">
                You reached the end of the shared deck. Review shortlist while the
                session resolves.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-[#E0B15C]/45 text-[#E0B15C]"
                  onPress={onOpenShortlist}
                >
                  Shortlist
                </Button>
                <Button
                  size="sm"
                  className="border border-[#E0B15C]/55 bg-[#E0B15C] text-[#171717]"
                  onPress={onGoHome}
                >
                  Back to Home
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
