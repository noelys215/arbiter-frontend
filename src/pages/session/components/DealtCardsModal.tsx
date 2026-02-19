import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
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
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
      hideCloseButton
      classNames={{
        base: "border border-[#E0B15C]/25 bg-[#1C110F]",
        header: "border-b border-[#E0B15C]/15",
        footer: "border-t border-[#E0B15C]/15",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="text-[#F5D9A5]">Your Dealt Cards</ModalHeader>
            <ModalBody>
              {cards.length === 0 ? (
                <p className="text-sm text-[#D9C7A8]">No cards selected yet.</p>
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
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                className="border-[#E0B15C]/35 text-[#E0B15C]"
                isDisabled={isSubmitting}
                onPress={onBack}
              >
                Back
              </Button>
              <Button
                className="border border-[#E0B15C]/55 bg-[#E0B15C] text-[#171717]"
                isLoading={isSubmitting}
                onPress={onContinue}
              >
                Continue
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
