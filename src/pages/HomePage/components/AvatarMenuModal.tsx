import {
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import KoFiSupportLink from "../../../components/KoFiSupportLink";
import { logout, updateDisplayName } from "../../../features/auth/auth.api";
import type { MeResponse } from "../../../features/auth/auth.api";
import {
  cancelFriendRequest,
  decideFriendRequest,
  sendFriendRequest,
} from "../../../features/friends/friends.api";
import type {
  Friend,
  FriendRequestsResponse,
} from "../../../features/friends/friends.api";
import {
  filterFriendsByGroup,
  type FriendFilter,
} from "../../../features/friends/friendFilters";
import {
  acceptGroupInvite,
  createGroup,
  createGroupLinkInvite,
  decideGroupInvitation,
  deleteGroup,
  getGroup,
  getGroupInvitations,
  leaveGroup,
  revokeGroupInvite,
  updateGroup,
} from "../../../features/groups/groups.api";
import type { Group } from "../../../features/groups/groups.api";
import type { ConfirmAction, InputClassNames, OnOpenChange } from "../types";
import ConfirmActionModal from "./ConfirmActionModal";
import InviteShareActions from "./InviteShareActions";

const AvatarSelectorModal = lazy(
  () => import("../../../features/avatar/AvatarSelectorModal"),
);

type AvatarMenuModalProps = {
  isOpen: boolean;
  onOpenChange: OnOpenChange;
  me: MeResponse | undefined;
  groups: Group[] | undefined;
  friends: Friend[] | undefined;
  friendRequests: FriendRequestsResponse | undefined;
  selectedGroup: Group | null;
  onGroupCleared: () => void;
  onOpenFeedback?: () => void;
};

const inputClassNames: InputClassNames = {
  label: "!text-[#EAD9BC]",
  input: "text-[#F7F1E3] placeholder:text-[#C7B18D]",
  inputWrapper:
    "border-[#E0B15C]/32 bg-[#22130F] focus-within:border-[#E0B15C] focus-within:ring-1 focus-within:ring-[#E0B15C]/60",
};

export default function AvatarMenuModal({
  isOpen,
  onOpenChange,
  me,
  groups,
  friends,
  friendRequests,
  selectedGroup,
  onGroupCleared,
  onOpenFeedback,
}: AvatarMenuModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmModal = useDisclosure();
  const avatarSelectorModal = useDisclosure();

  // Friend request state
  const [friendRequestEmail, setFriendRequestEmail] = useState("");
  const [friendRequestMessage, setFriendRequestMessage] = useState<string | null>(
    null,
  );

  // Group invite state
  const [groupInviteCode, setGroupInviteCode] = useState("");
  const [createdGroupInvite, setCreatedGroupInvite] = useState<{
    id: string;
    token: string;
    code: string;
  } | null>(null);

  // Create group state
  const [groupName, setGroupName] = useState("");
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(
    null,
  );
  const [groupNameDraft, setGroupNameDraft] = useState<{
    groupId: string;
    value: string;
  } | null>(null);
  const [groupSaveMessage, setGroupSaveMessage] = useState<{
    groupId: string;
    message: string;
  } | null>(null);

  // Confirm action state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  // Copy state
  const [selectedTab, setSelectedTab] = useState<"profile" | "friends" | "groups">("profile");
  const [friendFilter, setFriendFilter] = useState<FriendFilter>("all");
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const isOwner = selectedGroup?.owner_id === me?.id;
  const displayName = displayNameDraft ?? me?.display_name ?? "";
  const groupEditName =
    groupNameDraft && groupNameDraft.groupId === selectedGroup?.id
      ? groupNameDraft.value
      : selectedGroup?.name ?? "";
  const groupDetailQuery = useQuery({
    queryKey: ["group-detail", selectedGroup?.id],
    queryFn: () => getGroup(selectedGroup?.id ?? ""),
    enabled: Boolean(selectedGroup?.id),
  });
  const outgoingInvitesQuery = useQuery({
    queryKey: ["group-invitations", "outgoing", selectedGroup?.id],
    queryFn: () => getGroupInvitations(selectedGroup?.id),
    enabled: Boolean(selectedGroup?.id && isOwner),
  });
  const incomingInvitesQuery = useQuery({
    queryKey: ["group-invitations", "incoming"],
    queryFn: () => getGroupInvitations(),
  });
  const memberIds = useMemo(
    () => new Set((groupDetailQuery.data?.members ?? []).map((member) => member.id)),
    [groupDetailQuery.data?.members],
  );
  const pendingTargetIds = useMemo(
    () => new Set((outgoingInvitesQuery.data ?? []).flatMap((invite) => invite.target ? [invite.target.id] : [])),
    [outgoingInvitesQuery.data],
  );
  const filteredFriends = useMemo(() => {
    if (!friends || !selectedGroup) return friends ?? [];
    return filterFriendsByGroup(friends, memberIds, friendFilter);
  }, [friendFilter, friends, memberIds, selectedGroup]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  const updateDisplayNameMutation = useMutation({
    mutationFn: () => updateDisplayName(displayName.trim()),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
      setDisplayNameDraft(null);
      setProfileSaveMessage("Display name updated.");
    },
  });

  // Friend request mutations
  const sendFriendRequestMutation = useMutation({
    mutationFn: () => sendFriendRequest(friendRequestEmail.trim()),
    onSuccess: async () => {
      setFriendRequestEmail("");
      setFriendRequestMessage(
        "Request sent if an Arbiter account uses that email.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["friend-requests"],
        refetchType: "all",
      });
    },
  });
  const friendRequestDecisionMutation = useMutation({
    mutationFn: ({
      requestId,
      decision,
    }: {
      requestId: string;
      decision: "accept" | "decline";
    }) => decideFriendRequest(requestId, decision),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friend-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["friends"] }),
      ]);
    },
  });
  const cancelFriendRequestMutation = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] }),
  });
  const friendRequestError =
    sendFriendRequestMutation.error instanceof Error
      ? sendFriendRequestMutation.error.message
      : null;

  // Group invite mutations
  const createGroupInviteMutation = useMutation({
    mutationFn: () =>
      selectedGroup ? createGroupLinkInvite(selectedGroup.id) : Promise.reject(),
    onSuccess: (data) => {
      setCreatedGroupInvite(data);
    },
  });
  const regenerateGroupInviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGroup) throw new Error("No group selected");
      if (createdGroupInvite) await revokeGroupInvite(createdGroupInvite.id);
      return createGroupLinkInvite(selectedGroup.id);
    },
    onSuccess: (data) => setCreatedGroupInvite(data),
  });

  const targetedGroupInviteMutation = useMutation({
    mutationFn: (friendId: string) => {
      if (!selectedGroup) return Promise.reject(new Error("No group selected"));
      return createGroupLinkInvite(selectedGroup.id, friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group-invitations", "outgoing", selectedGroup?.id],
      });
    },
  });

  const groupDecisionMutation = useMutation({
    mutationFn: ({ inviteId, decision }: { inviteId: string; decision: "accept" | "decline" }) =>
      decideGroupInvitation(inviteId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const acceptGroupInviteMutation = useMutation({
    mutationFn: () => acceptGroupInvite(groupInviteCode.trim()),
    onSuccess: () => {
      setGroupInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: () => createGroup({ name: groupName.trim() }),
    onSuccess: () => {
      setGroupName("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: () => {
      if (!selectedGroup) return Promise.reject(new Error("No group selected"));
      return updateGroup(selectedGroup.id, groupEditName.trim());
    },
    onSuccess: async (updatedGroup) => {
      queryClient.setQueryData<Group[]>(["groups"], (current) =>
        current?.map((group) =>
          group.id === updatedGroup.id ? { ...group, ...updatedGroup } : group,
        ),
      );
      setGroupNameDraft(null);
      setGroupSaveMessage({
        groupId: updatedGroup.id,
        message: "Group name updated.",
      });
      await queryClient.invalidateQueries({
        queryKey: ["group-detail", updatedGroup.id],
      });
    },
  });

  // Leave/Delete group mutations
  const leaveGroupMutation = useMutation({
    mutationFn: () =>
      selectedGroup ? leaveGroup(selectedGroup.id) : Promise.reject(),
    onSuccess: () => {
      localStorage.removeItem("arbiter:lastGroupId");
      onGroupCleared();
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () =>
      selectedGroup ? deleteGroup(selectedGroup.id) : Promise.reject(),
    onSuccess: () => {
      localStorage.removeItem("arbiter:lastGroupId");
      onGroupCleared();
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const openConfirm = (payload: ConfirmAction) => {
    setConfirmAction(payload);
    confirmModal.onOpen();
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      deleteGroupMutation.mutate();
    } else if (confirmAction.type === "leave") {
      leaveGroupMutation.mutate();
    }
    confirmModal.onClose();
    setConfirmAction(null);
  };

  const isConfirmPending =
    leaveGroupMutation.isPending || deleteGroupMutation.isPending;
  const cleanedDisplayName = displayName.trim();
  const canSaveDisplayName =
    cleanedDisplayName.length > 0 &&
    cleanedDisplayName !== (me?.display_name ?? "").trim();
  const cleanedGroupName = groupEditName.trim();
  const canSaveGroupName =
    Boolean(isOwner && selectedGroup) &&
    cleanedGroupName.length > 0 &&
    cleanedGroupName !== (selectedGroup?.name ?? "").trim();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[calc(100dvh-2rem)] border border-[#E0B15C]/20 bg-[#1C110F]",
          wrapper: "items-end pb-4 sm:items-center sm:pb-0",
          backdrop: "bg-black/32",
          closeButton:
            "text-[#EAD9BC] hover:bg-[#E0B15C]/10 hover:text-[#F7EAD2] focus-visible:ring-2 focus-visible:ring-[#F2C16E]",
          header: "border-b border-[#E0B15C]/16",
          body: "py-5",
          footer: "border-t border-[#E0B15C]/16",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-4">
                <ArbiterAvatar
                  user={me}
                  size={56}
                  isBordered
                  className="bg-[#E0B15C] text-[#1C110F]"
                />
                <div>
                  <h2 className="app-heading-serif text-3xl leading-none text-[#F7EAD2]">
                    Account
                  </h2>
                  <p className="mt-1 text-sm app-muted">
                    Your profile, friends, and movie-night groups.
                  </p>
                </div>
              </ModalHeader>
              <ModalBody className="py-5">
                <Tabs
                  aria-label="Account sections"
                  selectedKey={selectedTab}
                  onSelectionChange={(key) =>
                    setSelectedTab(key as "profile" | "friends" | "groups")
                  }
                  destroyInactiveTabPanel={false}
                  variant="light"
                  classNames={{
                    base: "w-full",
                    tabList:
                      "w-full gap-5 rounded-none bg-transparent p-0",
                    tab: "h-10 border-b-2 border-transparent px-0 font-semibold data-[hover=true]:border-[#E0B15C]/40 data-[selected=true]:border-[#E0B15C]",
                    tabContent:
                      "!text-[#EAD9BC] group-data-[selected=true]:!text-[#F7EAD2]",
                    cursor: "hidden",
                    panel: "min-h-56 pt-5 sm:min-h-60",
                  }}
                >
                  <Tab key="profile" title="Profile">
                    <section className="space-y-5">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <ArbiterAvatar
                          user={me}
                          size={88}
                          isBordered
                          className="bg-[#E0B15C] text-[#1C110F]"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-semibold text-[#F7EAD2]">
                            {me?.display_name ?? me?.username ?? "Signed in"}
                          </h3>
                          <p className="mt-1 text-sm app-muted">
                            @{me?.username ?? "user"}
                          </p>
                          <p className="mt-1 break-all text-sm app-muted">
                            {me?.email ?? "-"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="bordered"
                          className="app-outline-button w-full sm:w-auto"
                          onPress={avatarSelectorModal.onOpen}
                        >
                          Edit avatar
                        </Button>
                      </div>
                      <form
                        className="grid gap-3 border-t app-rule pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (canSaveDisplayName) {
                            updateDisplayNameMutation.mutate();
                          }
                        }}
                      >
                        <Input
                          label="Display name"
                          aria-describedby="display-name-help"
                          value={displayName}
                          onValueChange={(value) => {
                            setDisplayNameDraft(value);
                            setProfileSaveMessage(null);
                          }}
                          maxLength={120}
                          variant="bordered"
                          className="sm:col-start-1 sm:row-start-1"
                          classNames={inputClassNames}
                        />
                        <p
                          id="display-name-help"
                          className="-mt-1 text-xs app-text-metadata sm:col-start-1 sm:row-start-2"
                        >
                          This is how your name appears to friends and groups.
                        </p>
                        <Button
                          type="submit"
                          className="app-outline-button w-full sm:col-start-2 sm:row-start-1 sm:w-auto"
                          variant="bordered"
                          isDisabled={!canSaveDisplayName}
                          isLoading={updateDisplayNameMutation.isPending}
                        >
                          Save name
                        </Button>
                      </form>
                      <div
                        className="min-h-5 text-sm"
                        role="status"
                        aria-live="polite"
                      >
                        {updateDisplayNameMutation.isError ? (
                          <p className="app-text-destructive">
                            We couldn’t update your display name. Please try again.
                          </p>
                        ) : profileSaveMessage ? (
                          <p className="app-text-secondary">{profileSaveMessage}</p>
                        ) : null}
                      </div>
                      {onOpenFeedback ? (
                        <div className="profile-feedback-section">
                          <div>
                            <p className="profile-support-eyebrow">Feedback</p>
                            <p className="mt-1 text-sm app-text-secondary">
                              Help improve Arbiter.
                            </p>
                          </div>
                          <Button
                            className="app-outline-button w-full sm:w-auto"
                            variant="bordered"
                            onPress={onOpenFeedback}
                          >
                            Send feedback
                          </Button>
                        </div>
                      ) : null}
                      <div className="profile-support-section">
                        <div>
                          <p className="profile-support-eyebrow">Support Arbiter</p>
                          <p className="mt-1 text-sm app-text-secondary">
                            Enjoying movie night?
                          </p>
                        </div>
                        <KoFiSupportLink
                          label="Support Arbiter on Ko-fi"
                          placement="profile"
                        />
                      </div>
                    </section>
                  </Tab>

                  <Tab key="friends" title="Friends">
                    <section className="space-y-5">
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          setFriendRequestMessage(null);
                          if (friendRequestEmail.trim()) {
                            sendFriendRequestMutation.mutate();
                          }
                        }}
                      >
                        <h3 className="text-lg font-semibold text-[#F7EAD2]">
                          Send a friend request
                        </h3>
                        <p className="text-sm app-muted">
                          Enter the email they use for Arbiter.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <Input
                            type="email"
                            label="Email"
                            placeholder="friend@example.com"
                            autoComplete="email"
                            value={friendRequestEmail}
                            onValueChange={(value) => {
                              setFriendRequestEmail(value);
                              setFriendRequestMessage(null);
                            }}
                            variant="bordered"
                            classNames={inputClassNames}
                            className="flex-1"
                          />
                          <Button
                            type="submit"
                            className="app-primary-button w-full sm:w-auto"
                            isDisabled={!friendRequestEmail.trim()}
                            isLoading={sendFriendRequestMutation.isPending}
                          >
                            Send request
                          </Button>
                        </div>
                        <div className="min-h-5 text-sm" aria-live="polite">
                          {friendRequestError ? (
                            <p className="app-text-destructive" role="alert">
                              {friendRequestError}
                            </p>
                          ) : friendRequestMessage ? (
                            <p className="app-text-secondary">
                              {friendRequestMessage}
                            </p>
                          ) : null}
                        </div>
                      </form>

                      <Divider className="bg-[#E0B15C]/10" />

                      <div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-lg font-semibold text-[#F7EAD2]">Your friends</h3>
                          {selectedGroup ? (
                            <div className="flex flex-wrap gap-1" aria-label="Filter friends">
                              {([
                                ["all", "All"],
                                ["in-group", "In current group"],
                                ["not-in-group", "Not in current group"],
                              ] as const).map(([value, label]) => (
                                <Button
                                  key={value}
                                  size="sm"
                                  variant="light"
                                  className="app-secondary-button"
                                  aria-pressed={friendFilter === value}
                                  onPress={() => setFriendFilter(value)}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {friends && friends.length > 0 ? (
                          <ul className="mt-3 divide-y app-rule">
                            {filteredFriends.map((friend) => {
                              const label = friend.display_name ?? friend.username ?? "Friend";
                              const inGroup = memberIds.has(friend.id);
                              const pending = pendingTargetIds.has(friend.id);
                              return (
                              <li
                                key={friend.id}
                                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <ArbiterAvatar user={friend} size="sm" label={label} className="bg-[#E0B15C]/20 text-[#E0B15C]" />
                                  <div>
                                    <span className="text-sm text-[#F7EAD2]">{label}</span>
                                    <p className="text-xs app-text-metadata">@{friend.username}</p>
                                  </div>
                                </div>
                                {selectedGroup && isOwner ? (
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="app-secondary-button self-start sm:self-auto"
                                    isDisabled={inGroup || pending}
                                    isLoading={targetedGroupInviteMutation.isPending && targetedGroupInviteMutation.variables === friend.id}
                                    onPress={() => targetedGroupInviteMutation.mutate(friend.id)}
                                    aria-label={inGroup ? `${label} is already in ${selectedGroup.name}` : pending ? `${label} has a pending invitation to ${selectedGroup.name}` : `Invite ${label} to ${selectedGroup.name}`}
                                  >
                                    {inGroup ? "In group" : pending ? "Pending" : `Invite to ${selectedGroup.name}`}
                                  </Button>
                                ) : null}
                              </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm app-muted">
                            No friends here yet. Share an invite to start choosing together.
                          </p>
                        )}
                        {friends && friends.length > 0 && filteredFriends.length === 0 ? (
                          <p className="mt-3 text-sm app-muted">
                            {friendFilter === "in-group"
                              ? `None of your friends are in ${selectedGroup?.name ?? "this group"} yet.`
                              : "All of your friends are already in this group."}
                          </p>
                        ) : null}
                      </div>

                      <Divider className="bg-[#E0B15C]/10" />

                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-lg font-semibold text-[#F7EAD2]">
                            Pending requests
                          </h3>
                          {(friendRequests?.incoming.length ?? 0) > 0 ? (
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] app-text-metadata">
                              {friendRequests?.incoming.length} waiting
                            </span>
                          ) : null}
                        </div>

                        {(friendRequests?.incoming.length ?? 0) > 0 ? (
                          <ul className="mt-3 divide-y app-rule" aria-label="Incoming friend requests">
                            {friendRequests?.incoming.map((request) => {
                              const label = request.user.display_name || request.user.username;
                              const isPending =
                                friendRequestDecisionMutation.isPending &&
                                friendRequestDecisionMutation.variables?.requestId === request.id;
                              return (
                                <li
                                  key={request.id}
                                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <ArbiterAvatar
                                      user={request.user}
                                      size="sm"
                                      label={label}
                                      className="bg-[#E0B15C]/20 text-[#E0B15C]"
                                    />
                                    <div>
                                      <p className="text-sm font-semibold text-[#F7EAD2]">
                                        {label}
                                      </p>
                                      <p className="text-xs app-text-metadata">
                                        Wants to connect
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="app-primary-button"
                                      isLoading={
                                        isPending &&
                                        friendRequestDecisionMutation.variables?.decision === "accept"
                                      }
                                      isDisabled={isPending}
                                      onPress={() =>
                                        friendRequestDecisionMutation.mutate({
                                          requestId: request.id,
                                          decision: "accept",
                                        })
                                      }
                                      aria-label={`Accept friend request from ${label}`}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="light"
                                      className="app-secondary-button"
                                      isLoading={
                                        isPending &&
                                        friendRequestDecisionMutation.variables?.decision === "decline"
                                      }
                                      isDisabled={isPending}
                                      onPress={() =>
                                        friendRequestDecisionMutation.mutate({
                                          requestId: request.id,
                                          decision: "decline",
                                        })
                                      }
                                      aria-label={`Decline friend request from ${label}`}
                                    >
                                      Not now
                                    </Button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm app-muted">
                            No requests are waiting for you.
                          </p>
                        )}

                        {(friendRequests?.outgoing.length ?? 0) > 0 ? (
                          <div className="mt-5">
                            <h4 className="text-sm font-semibold text-[#EAD9BC]">
                              Sent
                            </h4>
                            <ul className="mt-2 divide-y app-rule" aria-label="Sent friend requests">
                              {friendRequests?.outgoing.map((request) => {
                                const label = request.user.display_name || request.user.username;
                                return (
                                  <li
                                    key={request.id}
                                    className="flex items-center justify-between gap-3 py-3"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <ArbiterAvatar
                                        user={request.user}
                                        size="sm"
                                        label={label}
                                        className="bg-[#E0B15C]/20 text-[#E0B15C]"
                                      />
                                      <div className="min-w-0">
                                        <p className="truncate text-sm text-[#F7EAD2]">
                                          {label}
                                        </p>
                                        <p className="text-xs app-text-metadata">Pending</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="light"
                                      className="app-secondary-button"
                                      isLoading={
                                        cancelFriendRequestMutation.isPending &&
                                        cancelFriendRequestMutation.variables === request.id
                                      }
                                      onPress={() =>
                                        cancelFriendRequestMutation.mutate(request.id)
                                      }
                                      aria-label={`Cancel friend request to ${label}`}
                                    >
                                      Cancel
                                    </Button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                        {friendRequestDecisionMutation.isError ||
                        cancelFriendRequestMutation.isError ? (
                          <p className="mt-3 text-sm app-text-destructive" role="alert">
                            We couldn’t update that request. Please try again.
                          </p>
                        ) : null}
                      </div>
                    </section>
                  </Tab>

                  <Tab key="groups" title="Groups">
                    <section className="space-y-5">
                      <div>
                        <h3 className="text-lg font-semibold text-[#F7EAD2]">
                          Your groups
                        </h3>
                        {groups && groups.length > 0 ? (
                          <ul className="mt-3 divide-y app-rule">
                            {groups.map((group) => (
                              <li
                                key={group.id}
                                className="flex items-center justify-between gap-3 py-3"
                              >
                                <span className="text-sm text-[#F7EAD2]">
                                  {group.name}
                                </span>
                                {group.id === selectedGroup?.id ? (
                                  <span className="text-xs font-semibold uppercase tracking-[0.12em] app-text-metadata">
                                    Current
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm app-muted">
                            Create a group or join one with a code.
                          </p>
                        )}
                      </div>

                      {incomingInvitesQuery.data && incomingInvitesQuery.data.length > 0 ? (
                        <div className="space-y-3 border-t app-rule pt-5">
                          <h3 className="text-lg font-semibold text-[#F7EAD2]">Group invitations</h3>
                          <ul className="divide-y app-rule">
                            {incomingInvitesQuery.data.map((invite) => (
                              <li key={invite.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-[#F7EAD2]">{invite.group_name}</p>
                                  <p className="text-sm app-muted">Invited by {invite.inviter.display_name}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="app-primary-button"
                                    isLoading={groupDecisionMutation.isPending && groupDecisionMutation.variables?.inviteId === invite.id}
                                    onPress={() => groupDecisionMutation.mutate({ inviteId: invite.id, decision: "accept" })}
                                  >
                                    Join group
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="app-secondary-button"
                                    onPress={() => groupDecisionMutation.mutate({ inviteId: invite.id, decision: "decline" })}
                                  >
                                    Not now
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <Divider className="bg-[#E0B15C]/10" />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-[#F7EAD2]">
                            Create a group
                          </h3>
                          <Input
                            label="Group name"
                            placeholder="Movie night"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            variant="bordered"
                            classNames={inputClassNames}
                          />
                          <Button
                            className="app-outline-button"
                            variant="bordered"
                            onPress={() => createGroupMutation.mutate()}
                            isDisabled={!groupName.trim()}
                            isLoading={createGroupMutation.isPending}
                          >
                            Create group
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-[#F7EAD2]">
                            Join with a code
                          </h3>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <Input
                              label="Join with a code"
                              placeholder="Enter code"
                              value={groupInviteCode}
                              onChange={(e) => setGroupInviteCode(e.target.value)}
                              variant="bordered"
                              classNames={inputClassNames}
                            />
                            <Button
                              className="app-outline-button w-full sm:w-auto"
                              variant="bordered"
                              onPress={() => acceptGroupInviteMutation.mutate()}
                              isDisabled={!groupInviteCode.trim()}
                              isLoading={acceptGroupInviteMutation.isPending}
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      </div>

                      {selectedGroup ? (
                        <>
                          <Divider className="bg-[#D77B69]/15" />
                          <section className="space-y-3 rounded-lg border border-[#E0B15C]/16 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-[#F7EAD2]">
                                  Group settings
                                </h3>
                                <p className="mt-1 text-sm app-muted">
                                  Invite people or manage {selectedGroup.name}.
                                </p>
                              </div>
                              <Button
                                variant="light"
                                className="app-secondary-button"
                                onPress={() => setShowGroupSettings((value) => !value)}
                                aria-expanded={showGroupSettings}
                                aria-controls="group-settings-panel"
                              >
                                {showGroupSettings ? "Hide settings" : "Show settings"}
                              </Button>
                            </div>
                            <div
                              id="group-settings-panel"
                              hidden={!showGroupSettings}
                              className="space-y-4 border-t app-rule pt-4"
                            >
                              {isOwner ? (
                                <form
                                  className="space-y-3"
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    if (canSaveGroupName) {
                                      updateGroupMutation.mutate();
                                    }
                                  }}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <Input
                                      label="Group name"
                                      value={groupEditName}
                                      onValueChange={(value) => {
                                        if (selectedGroup) {
                                          setGroupNameDraft({
                                            groupId: selectedGroup.id,
                                            value,
                                          });
                                        }
                                        setGroupSaveMessage(null);
                                      }}
                                      maxLength={120}
                                      variant="bordered"
                                      className="flex-1"
                                      classNames={inputClassNames}
                                    />
                                    <Button
                                      type="submit"
                                      className="app-outline-button w-full sm:w-auto"
                                      variant="bordered"
                                      isDisabled={!canSaveGroupName}
                                      isLoading={updateGroupMutation.isPending}
                                    >
                                      Save name
                                    </Button>
                                  </div>
                                  <div
                                    className="min-h-5 text-sm"
                                    role="status"
                                    aria-live="polite"
                                  >
                                    {updateGroupMutation.isError ? (
                                      <p className="app-text-destructive">
                                        We couldn’t update the group name. Please try again.
                                      </p>
                                    ) : groupSaveMessage?.groupId ===
                                      selectedGroup.id ? (
                                      <p className="app-text-secondary">
                                        {groupSaveMessage.message}
                                      </p>
                                    ) : null}
                                  </div>
                                </form>
                              ) : null}
                              <div className="flex flex-wrap items-center gap-3">
                                <Button
                                  className="app-outline-button"
                                  variant="bordered"
                                  onPress={() => createGroupInviteMutation.mutate()}
                                  isDisabled={!selectedGroup}
                                  isLoading={createGroupInviteMutation.isPending}
                                >
                                  Invite people
                                </Button>
                              </div>
                              {createdGroupInvite ? (
                                <div className="space-y-2">
                                  <InviteShareActions
                                    path={`/invite/group/${createdGroupInvite.token}`}
                                    code={createdGroupInvite.code}
                                    title={`Join ${selectedGroup.name} on Arbiter`}
                                    text="Join my movie group on Arbiter."
                                  />
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="app-secondary-button"
                                    isLoading={regenerateGroupInviteMutation.isPending}
                                    onPress={() => regenerateGroupInviteMutation.mutate()}
                                  >
                                    Create a new link
                                  </Button>
                                </div>
                              ) : null}
                              <div className="border-t border-[#D77B69]/18 pt-4">
                                {isOwner ? (
                                  <Button
                                    className="app-danger-button"
                                    variant="bordered"
                                    onPress={() =>
                                      openConfirm({
                                        type: "delete",
                                        id: selectedGroup.id,
                                        label: `Delete ${selectedGroup.name}`,
                                      })
                                    }
                                    isLoading={deleteGroupMutation.isPending}
                                  >
                                    Delete group
                                  </Button>
                                ) : (
                                  <Button
                                    className="app-danger-button"
                                    variant="bordered"
                                    onPress={() =>
                                      openConfirm({
                                        type: "leave",
                                        id: selectedGroup.id,
                                        label: `Leave ${selectedGroup.name}`,
                                      })
                                    }
                                    isLoading={leaveGroupMutation.isPending}
                                  >
                                    Leave group
                                  </Button>
                                )}
                              </div>
                            </div>
                          </section>
                        </>
                      ) : null}
                    </section>
                  </Tab>
                </Tabs>
              </ModalBody>
              <ModalFooter className="justify-between">
                <Button
                  variant="light"
                  className="app-secondary-button"
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  className="app-danger-button"
                  variant="bordered"
                  onPress={() => logoutMutation.mutate()}
                  isLoading={logoutMutation.isPending}
                >
                  Logout
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onOpenChange={confirmModal.onOpenChange}
        confirmAction={confirmAction}
        onConfirm={handleConfirm}
        isLoading={isConfirmPending}
      />
      <Suspense fallback={null}>
        <AvatarSelectorModal
          isOpen={avatarSelectorModal.isOpen}
          onOpenChange={avatarSelectorModal.onOpenChange}
          me={me}
        />
      </Suspense>
    </>
  );
}
