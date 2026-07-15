import {
  AvatarGroup,
  Button,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import { unfriend } from "../../../features/friends/friends.api";
import type { Friend } from "../../../features/friends/friends.api";
import { addGroupMembers, getGroup } from "../../../features/groups/groups.api";
import type { Group } from "../../../features/groups/groups.api";
import type { ConfirmAction } from "../types";
import ConfirmActionModal from "./ConfirmActionModal";

type RightRailProps = {
  friends: Friend[] | undefined;
  selectedGroup: Group | null;
};

export default function RightRail({ friends, selectedGroup }: RightRailProps) {
  const queryClient = useQueryClient();
  const confirmModal = useDisclosure();
  const [pendingUnfriendId, setPendingUnfriendId] = useState<string | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const groupDetailsQuery = useQuery({
    queryKey: ["group-detail", selectedGroup?.id],
    queryFn: () => getGroup(selectedGroup?.id ?? ""),
    enabled: Boolean(selectedGroup?.id),
  });
  const members = useMemo(
    () => groupDetailsQuery.data?.members ?? [],
    [groupDetailsQuery.data?.members],
  );
  const memberIds = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  );

  const unfriendMutation = useMutation({
    mutationFn: (userId: string) => unfriend(userId),
    onMutate: (userId) => {
      setPendingUnfriendId(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onSettled: () => {
      setPendingUnfriendId(null);
    },
  });

  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!selectedGroup) {
        return Promise.reject(new Error("No group selected"));
      }
      return addGroupMembers(selectedGroup.id, {
        member_user_ids: [userId],
      });
    },
    onMutate: (userId) => {
      setPendingAddId(userId);
    },
    onSuccess: () => {
      if (selectedGroup?.id) {
        queryClient.invalidateQueries({
          queryKey: ["group-detail", selectedGroup.id],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onSettled: () => {
      setPendingAddId(null);
    },
  });

  const openConfirm = (payload: ConfirmAction) => {
    setConfirmAction(payload);
    confirmModal.onOpen();
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    unfriendMutation.mutate(confirmAction.id);
    confirmModal.onClose();
    setConfirmAction(null);
  };

  return (
    <aside className="rounded-xl border border-[#E0B15C]/10 bg-[#1C110F]/72 px-4 py-4" aria-label="Group and friends panel">
      <div className="space-y-5">
        {selectedGroup ? (
          <section>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] app-text-metadata">
                Current Group
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#F7EAD2]">
                <span className="sm:hidden">Members</span>
                <span className="hidden sm:inline">{selectedGroup.name}</span>
              </h3>
            </div>
            <div className="mt-3">
            {members.length > 0 ? (
              <AvatarGroup
                isBordered
                max={3}
                total={members.length}
                renderCount={(count) => (
                  <p className="text-xs font-medium app-text-metadata ms-2">
                    +{count} others
                  </p>
                )}
              >
                {members.slice(0, 3).map((member) => (
                  <ArbiterAvatar
                    key={member.id}
                    user={member}
                    className="bg-[#E0B15C]/20 text-[#E0B15C]"
                  />
                ))}
              </AvatarGroup>
            ) : null}
            </div>
          </section>
        ) : null}

        <section className={selectedGroup ? "border-t app-rule pt-5" : ""}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] app-text-metadata">
              Friends
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#F7EAD2]">
              {friends?.length ?? 0} connected
            </h3>
          </div>
          <div className="mt-3">
          {friends && friends.length > 0 ? (
            <ul className="divide-y app-rule">
              {friends.map((friend) => {
                const label =
                  friend.display_name ??
                  friend.username ??
                  friend.email ??
                  friend.id;
                const isMember = memberIds.has(friend.id);
                const addDisabled = !selectedGroup || isMember;
                return (
                  <li
                    key={friend.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <ArbiterAvatar
                        user={friend}
                        size="sm"
                        label={label}
                        className="bg-[#E0B15C]/20 text-[#E0B15C]"
                      />
                      <span className="text-sm app-text-primary">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        className="app-secondary-button"
                        onPress={() => addMemberMutation.mutate(friend.id)}
                        isDisabled={addDisabled}
                        isLoading={pendingAddId === friend.id}
                        aria-label={
                          isMember
                            ? `${label} is already in this group`
                            : `Add ${label} to current group`
                        }
                      >
                        {isMember ? "In group" : "Add"}
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        className="app-danger-button"
                        onPress={() =>
                          openConfirm({
                            type: "unfriend",
                            id: friend.id,
                            label,
                          })
                        }
                        isLoading={pendingUnfriendId === friend.id}
                        aria-label={`Unfriend ${label}`}
                      >
                        Unfriend
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm app-muted">
              No friends yet. Add people from the account menu.
            </p>
          )}
          </div>
        </section>
      </div>

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onOpenChange={confirmModal.onOpenChange}
        confirmAction={confirmAction}
        onConfirm={handleConfirm}
        isLoading={unfriendMutation.isPending}
      />
    </aside>
  );
}
