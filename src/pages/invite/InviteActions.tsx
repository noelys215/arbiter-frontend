import { Button } from "@heroui/react";
import { Link } from "react-router-dom";

type InviteActionsProps = {
  primaryLabel: string;
  primaryHref?: string;
  onPrimaryPress?: () => void;
  isPending?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export default function InviteActions({
  primaryLabel,
  primaryHref,
  onPrimaryPress,
  isPending = false,
  secondaryLabel,
  secondaryHref,
}: InviteActionsProps) {
  return (
    <>
      {primaryHref ? (
        <Link to={primaryHref} className="invite-primary-action">
          {primaryLabel}
        </Link>
      ) : (
        <Button
          className="invite-primary-action"
          isLoading={isPending}
          isDisabled={isPending}
          onPress={onPrimaryPress}
        >
          {primaryLabel}
        </Button>
      )}
      {secondaryLabel && secondaryHref ? (
        <Link to={secondaryHref} className="invite-secondary-action">
          {secondaryLabel}
        </Link>
      ) : null}
    </>
  );
}
