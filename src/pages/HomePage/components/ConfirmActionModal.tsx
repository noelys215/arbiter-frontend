import AppAlertDialog from "../../../components/ui/AppAlertDialog";
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
  const title =
    confirmAction?.type === "delete"
      ? "Delete this group?"
      : confirmAction?.type === "leave"
        ? "Leave this group?"
        : confirmAction?.type === "block"
          ? "Block this person?"
          : isTransfer
            ? "Transfer group ownership?"
            : "Remove this friend?";
  const confirmLabel =
    confirmAction?.type === "delete"
      ? "Delete group"
      : confirmAction?.type === "leave"
        ? "Leave group"
        : confirmAction?.type === "block"
          ? "Block"
          : isTransfer
            ? "Transfer ownership"
            : "Remove friend";
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
    <AppAlertDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      detail={confirmAction?.label}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      isPending={isLoading}
      tone={isTransfer ? "accent" : "danger"}
    />
  );
}
