import { Modal } from "@heroui/react";
import type { ReactNode } from "react";

type AppModalSize = "xs" | "sm" | "md" | "lg" | "cover" | "full";

type AppModalClasses = {
  backdrop?: string;
  container?: string;
  dialog?: string;
  closeButton?: string;
};

type AppModalProps = {
  children: (close: () => void) => ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ariaLabel: string;
  ariaDescribedBy?: string;
  size?: AppModalSize;
  scroll?: "inside" | "outside";
  placement?: "auto" | "top" | "center" | "bottom";
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  hideCloseButton?: boolean;
  classes?: AppModalClasses;
};

export default function AppModal({
  children,
  isOpen,
  onOpenChange,
  ariaLabel,
  ariaDescribedBy,
  size = "md",
  scroll = "inside",
  placement = "center",
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  hideCloseButton = false,
  classes,
}: AppModalProps) {
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      variant="opaque"
      className={classes?.backdrop}
    >
        <Modal.Container
          size={size}
          scroll={scroll}
          placement={placement}
          className={classes?.container}
        >
          <Modal.Dialog
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            className={classes?.dialog}
          >
            {({ close }) => (
              <>
                {!hideCloseButton ? (
                  <Modal.CloseTrigger
                    aria-label={`Close ${ariaLabel}`}
                    className={`!bg-transparent ${classes?.closeButton ?? ""}`}
                  />
                ) : null}
                {children(close)}
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
    </Modal.Backdrop>
  );
}

export const AppModalHeader = Modal.Header;
export const AppModalHeading = Modal.Heading;
export const AppModalBody = Modal.Body;
export const AppModalFooter = Modal.Footer;
