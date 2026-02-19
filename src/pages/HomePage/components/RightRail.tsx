import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  const members = groupDetailsQuery.data?.members ?? [];
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
    <aside className="flex flex-col gap-6" aria-label="Group and friends panel">
      {/* Group Context Card */}
      {selectedGroup ? (
        <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
          <CardHeader className="pb-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#E0B15C]/70">
                Current Group
              </p>
              <h3 className="text-lg font-semibold text-white">
                {selectedGroup.name}
              </h3>
            </div>
          </CardHeader>
          <CardBody className="pt-2 pl-5">
            {members.length > 0 ? (
              <AvatarGroup
                isBordered
                max={3}
                total={members.length}
                renderCount={(count) => (
                  <p className="text-xs text-[#D9C7A8] font-medium ms-2">
                    +{count} others
                  </p>
                )}
              >
                {members.slice(0, 3).map((member) => (
                  <Avatar
                    key={member.id}
                    src={member.avatar_url ?? undefined}
                    name={
                      member.display_name ?? member.username ?? member.email
                    }
                    className="bg-[#E0B15C]/20 text-[#E0B15C]"
                  />
                ))}
              </AvatarGroup>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {/* Friends List Card */}
      <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
        <CardHeader>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#E0B15C]/70">
              Friends
            </p>
            <h3 className="text-lg font-semibold text-white">
              {friends?.length ?? 0} CONNECTED
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {friends && friends.length > 0 ? (
            <ul className="space-y-3">
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
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#E0B15C]/10 bg-[#1C110F]/70 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={friend.avatar_url ?? undefined}
                        name={label}
                        className="bg-[#E0B15C]/20 text-[#E0B15C]"
                      />
                      <span className="text-sm text-white">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        className="border-[#E0B15C]/40 text-[#E0B15C] hover:bg-[#E0B15C]/10 uppercase"
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
                        variant="bordered"
                        className="border-[#D77B69]/40 text-[#D77B69] hover:bg-[#D77B69]/10 uppercase"
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
            <p className="text-sm text-[#D9C7A8]">
              No friends yet. Add some via the account menu!
            </p>
          )}
        </CardBody>
      </Card>

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
