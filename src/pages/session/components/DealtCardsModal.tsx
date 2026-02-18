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
        base: "border border-[#D4AF37]/25 bg-[#0B0B0B]",
        header: "border-b border-[#D4AF37]/15",
        footer: "border-t border-[#D4AF37]/15",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="text-[#F0DFA7]">Your Dealt Cards</ModalHeader>
            <ModalBody>
              {cards.length === 0 ? (
                <p className="text-sm text-[#A0A0A0]">No cards selected yet.</p>
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
                className="border-[#D4AF37]/35 text-[#D4AF37]"
                isDisabled={isSubmitting}
                onPress={onBack}
              >
                Back
              </Button>
              <Button
                className="border border-[#D4AF37]/55 bg-[#D4AF37] text-[#171717]"
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
