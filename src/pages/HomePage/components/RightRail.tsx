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
    <aside className="flex flex-col gap-6">
      {/* Group Context Card */}
      {selectedGroup ? (
        <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
          <CardHeader className="pb-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/70">
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
                  <p className="text-xs text-[#A0A0A0] font-medium ms-2">
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
                    className="bg-[#D4AF37]/20 text-[#D4AF37]"
                  />
                ))}
              </AvatarGroup>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {/* Friends List Card */}
      <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
        <CardHeader>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/70">
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
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/30 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={friend.avatar_url ?? undefined}
                        name={label}
                        className="bg-[#D4AF37]/20 text-[#D4AF37]"
                      />
                      <span className="text-sm text-white">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        onPress={() => addMemberMutation.mutate(friend.id)}
                        isDisabled={addDisabled}
                        isLoading={pendingAddId === friend.id}
                      >
                        {isMember ? "In group" : "Add"}
                      </Button>
                      <Button
                        size="sm"
                        variant="bordered"
                        className="border-[#7B1E2B]/40 text-[#7B1E2B] hover:bg-[#7B1E2B]/10"
                        onPress={() =>
                          openConfirm({
                            type: "unfriend",
                            id: friend.id,
                            label,
                          })
                        }
                        isLoading={pendingUnfriendId === friend.id}
                      >
                        Unfriend
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[#A0A0A0]">
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
