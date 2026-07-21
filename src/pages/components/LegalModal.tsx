import { Button } from "@heroui/react";
import AppModal, {
  AppModalBody,
  AppModalFooter,
  AppModalHeader,
  AppModalHeading,
} from "../../components/ui/AppModal";
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
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      ariaLabel={title}
      size="lg"
      classes={{
        dialog: "border border-[#E0B15C]/25 bg-[#1C110F] text-[#F7F1E3]",
        closeButton:
          "text-[#F5D9A5] hover:bg-[#E0B15C]/10 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#F2C16E]",
      }}
    >
      {(onClose) => (
          <>
            <AppModalHeader className="sr-only"><AppModalHeading>{title}</AppModalHeading></AppModalHeader>
            <AppModalBody className="px-5 py-6 sm:px-8">
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
            </AppModalBody>
            <AppModalFooter className="border-t border-[#E0B15C]/15">
              <Button
                className="border border-[#E0B15C]/55 bg-[#E0B15C] text-[#1C110F]"
                onPress={onClose}
              >
                Close
              </Button>
            </AppModalFooter>
          </>
      )}
    </AppModal>
  );
}
