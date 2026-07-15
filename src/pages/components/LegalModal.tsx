import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import {
  CreditsContent,
  DataDeletionContent,
  PrivacyPolicyContent,
} from "../legalContent";

type LegalModalKind = "privacy" | "data-deletion" | "credits";

type LegalModalProps = {
  kind: LegalModalKind;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSwitchKind: (kind: LegalModalKind) => void;
};

export default function LegalModal({
  kind,
  isOpen,
  onOpenChange,
  onSwitchKind,
}: LegalModalProps) {
  const title =
    kind === "privacy"
      ? "Privacy Policy"
      : kind === "data-deletion"
        ? "User Data Deletion"
        : "Credits";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      scrollBehavior="inside"
      size="3xl"
      classNames={{
        base: "border border-[#E0B15C]/25 bg-[#1C110F] text-[#F7F1E3]",
        body: "px-5 py-6 sm:px-8",
        footer: "border-t border-[#E0B15C]/15",
        closeButton:
          "text-[#F5D9A5] hover:bg-[#E0B15C]/10 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#F2C16E]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="sr-only">{title}</ModalHeader>
            <ModalBody>
              {kind === "privacy" ? (
                <PrivacyPolicyContent
                  linkMode="modal"
                  onOpenDataDeletion={() => onSwitchKind("data-deletion")}
                />
              ) : kind === "data-deletion" ? (
                <DataDeletionContent
                  linkMode="modal"
                  onOpenPrivacy={() => onSwitchKind("privacy")}
                />
              ) : (
                <CreditsContent />
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                className="border border-[#E0B15C]/55 bg-[#E0B15C] text-[#1C110F]"
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
