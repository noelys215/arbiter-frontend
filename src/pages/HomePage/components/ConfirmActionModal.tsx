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
                {confirmAction?.type === "delete"
                  ? "This will permanently delete the group."
                  : confirmAction?.type === "leave"
                    ? "You will be removed from this group."
                    : "This will remove the friendship."}
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
                className="border-[#D77B69]/50 text-[#D77B69] hover:bg-[#D77B69]/10"
                variant="bordered"
                onPress={onConfirm}
                isLoading={isLoading}
              >
                Confirm
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
