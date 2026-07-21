import {
  Button,
  useOverlayState,
} from "@heroui/react";
import AppAvatarGroup from "../../../components/ui/AppAvatarGroup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import { unfriend } from "../../../features/friends/friends.api";
import type { Friend } from "../../../features/friends/friends.api";
import {
  createGroupInvitation,
  getGroup,
  getGroupInvitations,
} from "../../../features/groups/groups.api";
import type { Group } from "../../../features/groups/groups.api";
import type { ConfirmAction } from "../types";
import ConfirmActionModal from "./ConfirmActionModal";
import {
  loadInsightsPage,
  loadMovieNightsPage,
} from "../../../app/routeLoaders";

type RightRailProps = {
  friends: Friend[] | undefined;
  selectedGroup: Group | null;
  currentUserId: string | null;
  onOpenAccount: () => void;
};

export default function RightRail({ friends, selectedGroup, currentUserId, onOpenAccount }: RightRailProps) {
  const queryClient = useQueryClient();
  const confirmModal = useOverlayState();
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
  const canInviteToGroup = Boolean(
    selectedGroup?.owner_id && selectedGroup.owner_id === currentUserId,
  );
  const outgoingInvitesQuery = useQuery({
    queryKey: ["group-invitations", "outgoing", selectedGroup?.id],
    queryFn: () => getGroupInvitations(selectedGroup?.id),
    enabled: Boolean(selectedGroup?.id && canInviteToGroup),
  });
  const pendingTargetIds = useMemo(
    () =>
      new Set(
        (outgoingInvitesQuery.data ?? [])
          .map((invite) => invite.target.id),
      ),
    [outgoingInvitesQuery.data],
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

  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const inviteMemberMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!selectedGroup) {
        return Promise.reject(new Error("No group selected"));
      }
      return createGroupInvitation(selectedGroup.id, userId);
    },
    onMutate: (userId) => {
      setPendingInviteId(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group-invitations", "outgoing", selectedGroup?.id],
      });
    },
    onSettled: () => {
      setPendingInviteId(null);
    },
  });

  const openConfirm = (payload: ConfirmAction) => {
    setConfirmAction(payload);
    confirmModal.open();
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    unfriendMutation.mutate(confirmAction.id);
    confirmModal.close();
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
              <AppAvatarGroup
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
              </AppAvatarGroup>
            ) : null}
            </div>
            <nav aria-label={`${selectedGroup.name} pages`} className="mt-4 flex flex-wrap gap-x-5">
              <Link
                to={`/app/groups/${selectedGroup.id}/movie-nights`}
                data-tour="movie-nights"
                className="inline-flex min-h-11 items-center border-b border-[#E0B15C]/28 text-sm font-semibold text-[#EAD9BC] outline-none transition-colors hover:border-[#E0B15C] hover:text-[#F7EAD2] focus-visible:ring-3 focus-visible:ring-[#F2C16E]"
                onMouseEnter={() => void loadMovieNightsPage()}
                onFocus={() => void loadMovieNightsPage()}
              >
                Movie Nights
              </Link>
              <Link
                to={`/app/groups/${selectedGroup.id}/insights`}
                className="inline-flex min-h-11 items-center border-b border-[#E0B15C]/28 text-sm font-semibold text-[#EAD9BC] outline-none transition-colors hover:border-[#E0B15C] hover:text-[#F7EAD2] focus-visible:ring-3 focus-visible:ring-[#F2C16E]"
                onMouseEnter={() => void loadInsightsPage()}
                onFocus={() => void loadInsightsPage()}
              >
                Insights <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </nav>
          </section>
        ) : null}

        <section
          className={selectedGroup ? "border-t app-rule pt-5" : ""}
          data-tour="friends"
        >
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
                  friend.id;
                const isMember = memberIds.has(friend.id);
                const isPending = pendingTargetIds.has(friend.id);
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
                      {selectedGroup && canInviteToGroup ? (
                        <Button
                          size="sm"
                          variant="tertiary"
                          className="app-secondary-button"
                          onPress={() => inviteMemberMutation.mutate(friend.id)}
                          isDisabled={isMember || isPending}
                          isPending={pendingInviteId === friend.id}
                          aria-label={
                            isMember
                              ? `${label} is already in this group`
                              : isPending
                                ? `${label} has a pending group invitation`
                                : `Invite ${label} to ${selectedGroup.name}`
                          }
                        >
                          {isMember ? "In group" : isPending ? "Pending" : "Invite"}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="tertiary"
                        className="app-danger-button"
                        onPress={() =>
                          openConfirm({
                            type: "unfriend",
                            id: friend.id,
                            label,
                          })
                        }
                        isPending={pendingUnfriendId === friend.id}
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
            <div className="space-y-3">
              <p className="text-sm app-muted">
                No friends here yet. Share an invite to start choosing together.
              </p>
              <Button size="sm" variant="tertiary" className="app-secondary-button" onPress={onOpenAccount}>
                Invite a friend
              </Button>
            </div>
          )}
          </div>
        </section>
      </div>

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onOpenChange={confirmModal.setOpen}
        confirmAction={confirmAction}
        onConfirm={handleConfirm}
        isLoading={unfriendMutation.isPending}
      />
    </aside>
  );
}
