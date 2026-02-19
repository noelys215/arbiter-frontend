import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import type { SessionCandidate } from "../../../features/sessions/sessions.api";
import type { SwipeVote } from "../types";
import TitlePosterRow from "./TitlePosterRow";

type ShortlistModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  shortlist: SessionCandidate[];
  localVotes: Record<string, SwipeVote>;
  winnerWatchlistItemId: string | null;
  getReadableVote: (vote: SwipeVote | undefined) => string;
};

export default function ShortlistModal({
  isOpen,
  onOpenChange,
  shortlist,
  localVotes,
  winnerWatchlistItemId,
  getReadableVote,
}: ShortlistModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
                  No shortlist yet. Swipe yes/maybe or finish the deck.
                </p>
              ) : (
                <div className="space-y-2">
                  {shortlist.map((card) => {
                    const vote = localVotes[card.watchlist_item_id];
                    const isWinner =
                      winnerWatchlistItemId === card.watchlist_item_id;

                    return (
                      <TitlePosterRow
                        key={card.watchlist_item_id}
                        id={card.watchlist_item_id}
                        title={card.title.name}
                        subtitle={String(card.title.release_year ?? "Unknown year")}
                        posterPath={card.title.poster_path}
                        highlighted={isWinner}
                        rightContent={
                          isWinner ? (
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
                          ) : vote ? (
                            <Chip
                              size="sm"
                              variant="bordered"
                              classNames={{
                                base: "border-[#E0B15C]/40",
                                content: "text-[#E0B15C]",
                              }}
                            >
                              {getReadableVote(vote)}
                            </Chip>
                          ) : null
                        }
                      />
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
