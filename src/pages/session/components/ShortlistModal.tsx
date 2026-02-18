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
        base: "border border-[#D4AF37]/25 bg-[#0B0B0B]",
        header: "border-b border-[#D4AF37]/15",
        footer: "border-t border-[#D4AF37]/15",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-[#F0DFA7]">Shortlist</ModalHeader>
            <ModalBody>
              {shortlist.length === 0 ? (
                <p className="text-sm text-[#A0A0A0]">
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
                                base: "bg-[#D4AF37]/20",
                                content: "text-[#F4DE9E]",
                              }}
                            >
                              Winner
                            </Chip>
                          ) : vote ? (
                            <Chip
                              size="sm"
                              variant="bordered"
                              classNames={{
                                base: "border-[#D4AF37]/40",
                                content: "text-[#D4AF37]",
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
                className="border-[#D4AF37]/35 text-[#D4AF37]"
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
