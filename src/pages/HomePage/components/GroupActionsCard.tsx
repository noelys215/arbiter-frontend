import { Button, Card, Separator, useOverlayState } from "@heroui/react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroup, leaveGroup } from "../../../features/groups/groups.api";
import ConfirmActionModal from "./ConfirmActionModal";
import type { ConfirmAction } from "../types";
import type { Group } from "../../../features/groups/groups.api";

type GroupActionsCardProps = {
  selectedGroup: Group;
  meId?: string;
  onGroupCleared: () => void;
};

export default function GroupActionsCard({
  selectedGroup,
  meId,
  onGroupCleared,
}: GroupActionsCardProps) {
  const isOwner = selectedGroup.owner_id === meId;
  const queryClient = useQueryClient();
  const confirmModal = useOverlayState();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const leaveMutation = useMutation({
    mutationFn: () => leaveGroup(selectedGroup.id),
    onSuccess: () => {
      localStorage.removeItem("arbiter:lastGroupId");
      onGroupCleared();
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(selectedGroup.id),
    onSuccess: () => {
      localStorage.removeItem("arbiter:lastGroupId");
      onGroupCleared();
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const openConfirm = (payload: ConfirmAction) => {
    setConfirmAction(payload);
    confirmModal.open();
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      deleteMutation.mutate();
    } else {
      leaveMutation.mutate();
    }
    confirmModal.close();
    setConfirmAction(null);
  };

  const isConfirmPending = leaveMutation.isPending || deleteMutation.isPending;

  return (
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <Card.Header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D9C7A8]">
            Group actions
          </p>
          <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {isOwner ? (
            <Button
              className="bg-[#E0B15C] text-[#1C110F]"
              onPress={() =>
                openConfirm({
                  type: "delete",
                  id: selectedGroup.id,
                  label: `Delete ${selectedGroup.name}`,
                })
              }
              isPending={deleteMutation.isPending}
            >
              Delete group
            </Button>
          ) : (
            <Button
              className="bg-[#E0B15C] text-[#1C110F]"
              onPress={() =>
                openConfirm({
                  type: "leave",
                  id: selectedGroup.id,
                  label: `Leave ${selectedGroup.name}`,
                })
              }
              isPending={leaveMutation.isPending}
            >
              Leave group
            </Button>
          )}
        </div>
      </Card.Header>
      <Separator className="bg-[#E0B15C]/15" />
      <Card.Content className="text-sm text-[#D9C7A8]">
        {isOwner
          ? "Owners can delete their group."
          : "Leaving will remove you from this group."}
      </Card.Content>
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onOpenChange={confirmModal.setOpen}
        confirmAction={confirmAction}
        onConfirm={handleConfirm}
        isLoading={isConfirmPending}
      />
    </Card>
  );
}
