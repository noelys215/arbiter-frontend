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
        base: "bg-[#0B0B0B] border border-[#7B1E2B]/30",
        header: "border-b border-[#7B1E2B]/20",
        body: "py-6",
        footer: "border-t border-[#7B1E2B]/20",
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
              <p className="text-sm text-[#A0A0A0]">{confirmAction?.label}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                className="border-[#A0A0A0]/30 text-[#A0A0A0]"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                className="border-[#7B1E2B]/50 text-[#7B1E2B] hover:bg-[#7B1E2B]/10"
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
