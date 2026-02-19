import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      classNames={{
        base: "bg-[#1C110F] border border-[#E0B15C]/20",
        header: "border-b border-[#E0B15C]/10",
        body: "py-6",
        footer: "border-t border-[#E0B15C]/10",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-white">Add manual item</ModalHeader>
            <ModalBody className="space-y-3">
              <Input
                label="Title"
                placeholder="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                isRequired
                variant="bordered"
                classNames={inputClassNames}
              />
              <Input
                label="Year (optional)"
                placeholder="2024"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                variant="bordered"
                classNames={inputClassNames}
              />
            </ModalBody>
            <ModalFooter>
              {addManualMutation.isError ? (
                <p className="mr-auto text-sm text-[#D77B69]">
                  Unable to add to watchlist.
                </p>
              ) : null}
              <Button
                variant="bordered"
                className="border-[#D9C7A8]/30 text-[#D9C7A8]"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                className="border-[#E0B15C]/50 text-[#E0B15C] hover:bg-[#E0B15C]/10"
                variant="bordered"
                onPress={() => addManualMutation.mutate()}
                isDisabled={!title.trim() || !selectedGroupId}
                isLoading={addManualMutation.isPending}
              >
                Add
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
