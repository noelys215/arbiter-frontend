import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
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
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        base: "bg-[#1C110F] border border-[#D77B69]/30",
        header: "border-b border-[#D77B69]/20",
        body: "py-6",
        footer: "border-t border-[#D77B69]/20",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-white">Confirm action</ModalHeader>
            <ModalBody>
              <p className="text-sm text-[#EDEDED]">
                {description}
              </p>
              <p className="text-sm text-[#D9C7A8]">{confirmAction?.label}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                className="border-[#D9C7A8]/30 text-[#D9C7A8]"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                className={isTransfer ? "app-primary-button" : "app-danger-button"}
                variant={isTransfer ? "solid" : "bordered"}
                onPress={onConfirm}
                isLoading={isLoading}
              >
                {isTransfer ? "Transfer ownership" : "Confirm"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
