import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import AppAlertDialog from "./AppAlertDialog";

function AlertDialogHarness({ onConfirm }: { onConfirm: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AppAlertDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Remove this title?"
      description="It will be removed from this group’s watchlist."
      confirmLabel="Remove title"
      onConfirm={onConfirm}
    />
  );
}

describe("AppAlertDialog", () => {
  it("requires an explicit action and exposes the confirmation semantics", () => {
    const onConfirm = vi.fn();
    render(<AlertDialogHarness onConfirm={onConfirm} />);

    const dialog = screen.getByRole("alertdialog", {
      name: "Remove this title?",
    });
    expect(dialog).toHaveTextContent(
      "It will be removed from this group’s watchlist.",
    );
    expect(dialog.closest("[data-placement]")).toHaveAttribute(
      "data-placement",
      "auto",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("runs the supplied confirmation action", () => {
    const onConfirm = vi.fn();
    render(<AlertDialogHarness onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove title" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
