import { Button } from "@heroui/react";
import AppModal, { AppModalBody, AppModalFooter, AppModalHeader, AppModalHeading } from "../../../components/ui/AppModal";
import type { SessionCandidate } from "../../../features/sessions/sessions.api";
import TitlePosterRow from "./TitlePosterRow";

type DealtCardsModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cards: SessionCandidate[];
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export default function DealtCardsModal({
  isOpen,
  onOpenChange,
  cards,
  isSubmitting,
  onBack,
  onContinue,
}: DealtCardsModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      ariaLabel="Your dealt cards"
      isDismissable={false}
      hideCloseButton
      classes={{
        dialog: "border border-[#E0B15C]/25 bg-[#1C110F]",
      }}
    >
      {() => (
          <>
            <AppModalHeader className="border-b border-[#E0B15C]/15 text-[#F5D9A5]"><AppModalHeading>Your Dealt Cards</AppModalHeading></AppModalHeader>
            <AppModalBody>
              {cards.length === 0 ? (
                <p className="text-sm text-[#D9C7A8]">
                  No titles matched this request. Go back and try a broader vibe.
                </p>
              ) : (
                <div className="space-y-2">
                  {cards.map((card) => (
                    <TitlePosterRow
                      key={`preview-${card.watchlist_item_id}`}
                      id={`preview-${card.watchlist_item_id}`}
                      title={card.title.name}
                      subtitle={String(card.title.release_year ?? "Unknown year")}
                      posterPath={card.title.poster_path}
                    />
                  ))}
                </div>
              )}
            </AppModalBody>
            <AppModalFooter className="border-t border-[#E0B15C]/15">
              <Button
                variant="secondary"
                className="border-[#E0B15C]/35 text-[#E0B15C]"
                isDisabled={isSubmitting}
                onPress={onBack}
              >
                Back
              </Button>
              <Button
                className="border border-[#E0B15C]/55 bg-[#E0B15C] text-[#171717]"
                isPending={isSubmitting}
                isDisabled={cards.length === 0}
                onPress={onContinue}
              >
                Continue
              </Button>
            </AppModalFooter>
          </>
      )}
    </AppModal>
  );
}
