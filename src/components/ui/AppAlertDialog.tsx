import { AlertDialog, Button } from "@heroui/react";
import { useId, type ReactNode } from "react";

const fluidBackdropMotion =
  "data-[entering]:duration-500 data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)] data-[exiting]:duration-200 data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)] motion-reduce:transition-none";

const fluidContainerMotion =
  "data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:slide-in-from-bottom-4 data-[entering]:duration-500 data-[entering]:ease-[cubic-bezier(0.25,1,0.5,1)] data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:slide-out-to-bottom-2 data-[exiting]:duration-200 data-[exiting]:ease-[cubic-bezier(0.5,0,0.75,0)] motion-reduce:animate-none motion-reduce:transition-none";

type AppAlertDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: ReactNode;
  detail?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  tone?: "danger" | "accent";
};

export default function AppAlertDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  detail,
  confirmLabel,
  onConfirm,
  isPending = false,
  tone = "danger",
}: AppAlertDialogProps) {
  const descriptionId = useId();

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="opaque"
      className={fluidBackdropMotion}
    >
      <AlertDialog.Container
        placement="auto"
        size="xs"
        className={fluidContainerMotion}
      >
        <AlertDialog.Dialog
          aria-describedby={descriptionId}
          className="border border-[#E0B15C]/24 bg-[#1C110F] text-[#F7EAD2] shadow-2xl shadow-black/45"
        >
          <AlertDialog.Header className="border-b border-[#E0B15C]/12 px-5 py-4 sm:px-6">
            <AlertDialog.Heading className="app-heading-serif text-[1.55rem] leading-tight text-[#F7EAD2]">
              {title}
            </AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="space-y-2 px-5 py-5 sm:px-6">
            <p
              id={descriptionId}
              className="text-sm leading-6 app-text-secondary"
            >
              {description}
            </p>
            {detail ? (
              <div className="text-sm leading-6 app-text-metadata">{detail}</div>
            ) : null}
          </AlertDialog.Body>
          <AlertDialog.Footer className="flex-row justify-end gap-2 border-t border-[#E0B15C]/12 px-5 py-4 sm:px-6">
            <Button
              variant="tertiary"
              className="app-secondary-button min-h-11 px-4"
              onPress={() => onOpenChange(false)}
              isDisabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant={tone === "accent" ? "primary" : "secondary"}
              className={`${tone === "accent" ? "app-primary-button" : "app-danger-button"} min-h-11 px-4`}
              onPress={onConfirm}
              isPending={isPending}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
