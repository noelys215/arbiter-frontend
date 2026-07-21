import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppTextField } from "../../../components/ui/AppField";
import AppModal, { AppModalBody, AppModalFooter, AppModalHeader, AppModalHeading } from "../../../components/ui/AppModal";
import { addManualToWatchlist } from "../../../features/watchlist/watchlist.api";
import type { InputClassNames, OnOpenChange } from "../types";

type ManualAddModalProps = {
  isOpen: boolean;
  onOpenChange: OnOpenChange;
  selectedGroupId: string | null;
  inputClassNames: InputClassNames;
};

export default function ManualAddModal({
  isOpen,
  onOpenChange,
  selectedGroupId,
  inputClassNames,
}: ManualAddModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");

  const handleOpenChange: OnOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setTitle("");
      setYear("");
    }
    onOpenChange(nextOpen);
  };

  const addManualMutation = useMutation({
    mutationFn: () =>
      addManualToWatchlist(selectedGroupId ?? "", {
        title: title.trim(),
        year: year ? Number(year) : undefined,
      }),
    onSuccess: () => {
      handleOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: ["watchlist-library", selectedGroupId],
      });
      queryClient.invalidateQueries({
        queryKey: ["watchlist", selectedGroupId],
      });
    },
  });

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      ariaLabel="Add manual item"
      classes={{
        dialog: "bg-[#1C110F] border border-[#E0B15C]/20",
      }}
    >
      {(onClose) => (
          <>
            <AppModalHeader className="border-b border-[#E0B15C]/10 text-white"><AppModalHeading>Add manual item</AppModalHeading></AppModalHeader>
            <AppModalBody className="space-y-3 py-6">
              <AppTextField
                label="Title"
                placeholder="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                isRequired
                classes={inputClassNames}
              />
              <AppTextField
                label="Year (optional)"
                placeholder="2024"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                classes={inputClassNames}
              />
            </AppModalBody>
            <AppModalFooter className="border-t border-[#E0B15C]/10">
              {addManualMutation.isError ? (
                <p className="mr-auto text-sm text-[#D77B69]">
                  Unable to add to watchlist.
                </p>
              ) : null}
              <Button
                variant="secondary"
                className="border-[#D9C7A8]/30 text-[#D9C7A8]"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                className="border-[#E0B15C]/50 text-[#E0B15C] hover:bg-[#E0B15C]/10"
                variant="secondary"
                onPress={() => addManualMutation.mutate()}
                isDisabled={!title.trim() || !selectedGroupId}
                isPending={addManualMutation.isPending}
              >
                Add
              </Button>
            </AppModalFooter>
          </>
      )}
    </AppModal>
  );
}
