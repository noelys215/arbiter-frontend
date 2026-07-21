import { Button } from "@heroui/react";
import AppModal, { AppModalBody, AppModalFooter, AppModalHeader, AppModalHeading } from "../../../components/ui/AppModal";
import type { ConfirmAction, OnOpenChange } from "../types";

type ConfirmActionModalProps = {
  isOpen: boolean;
  onOpenChange: OnOpenChange;
  confirmAction: ConfirmAction | null;
  onConfirm: () => void;
  isLoading: boolean;
};

export default function ConfirmActionModal({
  isOpen,
  onOpenChange,
  confirmAction,
  onConfirm,
  isLoading,
}: ConfirmActionModalProps) {
  const isTransfer = confirmAction?.type === "transfer";
  const description =
    confirmAction?.type === "delete"
      ? "This will permanently delete the group."
      : confirmAction?.type === "leave"
        ? "You will be removed from this group."
        : confirmAction?.type === "block"
          ? "This removes the friendship and prevents future requests until you unblock them."
          : isTransfer
            ? "They will manage invitations, the group name, and group settings. You will remain a member."
            : "This will remove the friendship.";

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      ariaLabel="Confirm action"
      classes={{
        dialog: "bg-[#1C110F] border border-[#D77B69]/30",
      }}
    >
      {(onClose) => (
          <>
            <AppModalHeader className="border-b border-[#D77B69]/20 text-white"><AppModalHeading>Confirm action</AppModalHeading></AppModalHeader>
            <AppModalBody className="py-6">
              <p className="text-sm text-[#EDEDED]">
                {description}
              </p>
              <p className="text-sm text-[#D9C7A8]">{confirmAction?.label}</p>
            </AppModalBody>
            <AppModalFooter className="border-t border-[#D77B69]/20">
              <Button
                variant="secondary"
                className="border-[#D9C7A8]/30 text-[#D9C7A8]"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                className={isTransfer ? "app-primary-button" : "app-danger-button"}
                variant={isTransfer ? "primary" : "secondary"}
                onPress={onConfirm}
                isPending={isLoading}
              >
                {isTransfer ? "Transfer ownership" : "Confirm"}
              </Button>
            </AppModalFooter>
          </>
      )}
    </AppModal>
  );
}
