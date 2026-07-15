import {
  Avatar,
  AvatarGroup,
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import type {
  SessionCandidate,
  SessionVoteParticipant,
  SessionVoteSummary,
} from "../../../features/sessions/sessions.api";
import { tmdbPosterUrl } from "../../../lib/tmdb";
import type { SwipeVote } from "../types";

type ShortlistModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  shortlist: SessionCandidate[];
  voteSummaries: SessionVoteSummary[];
  localVotes: Record<string, SwipeVote>;
  winnerWatchlistItemId: string | null;
  getReadableVote: (vote: SwipeVote | undefined) => string;
};

function getVoteParticipants(
  summary: SessionVoteSummary | undefined,
  vote: SwipeVote,
) {
  return summary?.voters.filter((voter) => voter.vote === vote) ?? [];
}

function VoteAvatarGroup({
  label,
  voters,
}: {
  label: string;
  voters: SessionVoteParticipant[];
}) {
  if (voters.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#D9C7A8]/60">
        <span className="min-w-8 uppercase tracking-[0.14em]">{label}</span>
        <span>None yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-8 text-xs uppercase tracking-[0.14em] text-[#E0B15C]/75">
        {label}
      </span>
      <AvatarGroup
        isBordered
        max={4}
        total={voters.length}
        size="sm"
        renderCount={(count) => (
          <span className="ms-1 text-xs font-semibold text-[#D9C7A8]">
            +{count}
          </span>
        )}
      >
        {voters.slice(0, 4).map((voter) => (
          <Avatar
            key={`${voter.user_id}-${voter.vote}`}
            src={voter.avatar_url ?? undefined}
            name={voter.display_name}
            showFallback
            className="bg-[#E0B15C]/20 text-[#E0B15C]"
            imgProps={{ referrerPolicy: "no-referrer" }}
          />
        ))}
      </AvatarGroup>
    </div>
  );
}

export default function ShortlistModal({
  isOpen,
  onOpenChange,
  shortlist,
  voteSummaries,
  localVotes,
  winnerWatchlistItemId,
  getReadableVote,
}: ShortlistModalProps) {
  const summariesById = new Map(
    voteSummaries.map((summary) => [summary.watchlist_item_id, summary]),
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      classNames={{
        base: "border border-[#E0B15C]/25 bg-[#1C110F]",
        header: "border-b border-[#E0B15C]/15",
        footer: "border-t border-[#E0B15C]/15",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-[#F5D9A5]">Shortlist</ModalHeader>
            <ModalBody>
              {shortlist.length === 0 ? (
                <p className="text-sm text-[#D9C7A8]">
                  No shortlist yet. Swipe yes or finish the deck.
                </p>
              ) : (
                <div className="space-y-2">
                  {shortlist.map((card) => {
                    const vote = localVotes[card.watchlist_item_id];
                    const isWinner =
                      winnerWatchlistItemId === card.watchlist_item_id;
                    const summary = summariesById.get(card.watchlist_item_id);
                    const poster = tmdbPosterUrl(card.title.poster_path, "w342");
                    const yesVoters = getVoteParticipants(summary, "yes");
                    const noVoters = getVoteParticipants(summary, "no");
                    const tally = summary
                      ? `${summary.yes_count}–${summary.no_count}`
                      : vote
                        ? getReadableVote(vote)
                        : "0–0";

                    return (
                      <article
                        key={card.watchlist_item_id}
                        className={`grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 ${
                          isWinner || summary?.is_leading
                            ? "border-[#E0B15C]/70 bg-[#E0B15C]/10"
                            : "border-[#E0B15C]/20 bg-black/35"
                        }`}
                      >
                        {poster ? (
                          <img
                            src={poster}
                            alt={card.title.name}
                            className="h-20 w-[3.25rem] rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-[3.25rem] items-center justify-center rounded-md border border-[#E0B15C]/20 text-[10px] text-[#D9C7A8]">
                            N/A
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[#F7F1E3]">
                            {card.title.name}
                          </p>
                          <div className="mt-2 flex flex-col gap-1.5">
                            <VoteAvatarGroup label="Yes" voters={yesVoters} />
                            <VoteAvatarGroup label="No" voters={noVoters} />
                          </div>
                          {vote ? (
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#E0B15C]/75">
                              Your vote: {getReadableVote(vote)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isWinner ? (
                            <Chip
                              size="sm"
                              variant="flat"
                              classNames={{
                                base: "bg-[#E0B15C]/20",
                                content: "text-[#F5D9A5]",
                              }}
                            >
                              Winner
                            </Chip>
                          ) : summary?.is_leading ? (
                            <Chip
                              size="sm"
                              variant="flat"
                              classNames={{
                                base: "bg-[#E0B15C]/20",
                                content: "text-[#F5D9A5]",
                              }}
                            >
                              Leading
                            </Chip>
                          ) : null}
                          <strong className="whitespace-nowrap text-lg text-[#F5D9A5]">
                            {tally}
                          </strong>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                className="border-[#E0B15C]/35 text-[#E0B15C]"
                onPress={onClose}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
