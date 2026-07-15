import {
  Button,
  Chip,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import { logout } from "../../../features/auth/auth.api";
import type { MeResponse } from "../../../features/auth/auth.api";
import {
  acceptFriendInvite,
  createFriendInvite,
} from "../../../features/friends/friends.api";
import type { Friend } from "../../../features/friends/friends.api";
import {
  acceptGroupInvite,
  createGroup,
  createGroupInvite,
  deleteGroup,
  leaveGroup,
} from "../../../features/groups/groups.api";
import type { Group } from "../../../features/groups/groups.api";
import type { ConfirmAction, InputClassNames, OnOpenChange } from "../types";
import ConfirmActionModal from "./ConfirmActionModal";

const AvatarSelectorModal = lazy(
  () => import("../../../features/avatar/AvatarSelectorModal"),
);

type AvatarMenuModalProps = {
  isOpen: boolean;
  onOpenChange: OnOpenChange;
  me: MeResponse | undefined;
  groups: Group[] | undefined;
  friends: Friend[] | undefined;
  selectedGroup: Group | null;
  onGroupCleared: () => void;
};

const inputClassNames: InputClassNames = {
  label: "text-[#E0B15C]/80",
  input: "text-white placeholder:text-white/40",
  inputWrapper:
    "border-[#E0B15C]/20 bg-[#22130F] focus-within:border-[#E0B15C]",
};

export default function AvatarMenuModal({
  isOpen,
  onOpenChange,
  me,
  groups,
  friends,
  selectedGroup,
  onGroupCleared,
}: AvatarMenuModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmModal = useDisclosure();
  const avatarSelectorModal = useDisclosure();

  // Friend invite state
  const [friendInviteCode, setFriendInviteCode] = useState("");
  const [createdFriendCode, setCreatedFriendCode] = useState<string | null>(
    null,
  );

  // Group invite state
  const [groupInviteCode, setGroupInviteCode] = useState("");
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null);

  // Create group state
  const [groupName, setGroupName] = useState("");

  // Confirm action state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"profile" | "friends" | "groups">("profile");
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const isOwner = selectedGroup?.owner_id === me?.id;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  // Friend invite mutations
  const createFriendInviteMutation = useMutation({
    mutationFn: createFriendInvite,
    onSuccess: (data) => {
      setCreatedFriendCode(data.code);
    },
  });

  const acceptFriendInviteMutation = useMutation({
    mutationFn: () => acceptFriendInvite(friendInviteCode.trim()),
    onSuccess: async () => {
      setFriendInviteCode("");
      await queryClient.invalidateQueries({
        queryKey: ["friends"],
        refetchType: "all",
      });
    },
  });
  const acceptFriendInviteErrorDetail =
    acceptFriendInviteMutation.error &&
    typeof acceptFriendInviteMutation.error === "object" &&
    "detail" in acceptFriendInviteMutation.error &&
    typeof (acceptFriendInviteMutation.error as { detail?: unknown })
      .detail === "string"
      ? (acceptFriendInviteMutation.error as { detail?: string }).detail
      : null;

  // Group invite mutations
  const createGroupInviteMutation = useMutation({
    mutationFn: () =>
      selectedGroup ? createGroupInvite(selectedGroup.id) : Promise.reject(),
    onSuccess: (data) => {
      setCreatedGroupCode(data.code);
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

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // ignore
    }
  };

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "border border-[#E0B15C]/24 bg-[#1C110F]",
          backdrop: "bg-black/45",
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
                      "w-full rounded-lg border border-[#E0B15C]/22 bg-[#120B09]/80 p-1",
                    tab: "h-9 px-3 font-semibold text-[#E4D1B2] data-[hover=true]:text-[#F7EAD2] data-[selected=true]:text-[#160C0A]",
                    cursor: "rounded-md bg-[#E0B15C] shadow-sm",
                    panel: "pt-5",
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
                    </section>
                  </Tab>

                  <Tab key="friends" title="Friends">
                    <section className="space-y-5">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-[#F7EAD2]">
                          Friend invites
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            className="app-outline-button"
                            variant="bordered"
                            onPress={() => createFriendInviteMutation.mutate()}
                            isLoading={createFriendInviteMutation.isPending}
                          >
                            Create invite
                          </Button>
                          {createdFriendCode ? (
                            <div className="flex items-center gap-2">
                              <Chip
                                variant="bordered"
                                classNames={{
                                  base: "border-[#E0B15C]/35",
                                  content: "text-[#F5D9A5]",
                                }}
                              >
                                {createdFriendCode}
                              </Chip>
                              <Button
                                size="sm"
                                variant="light"
                                className="app-secondary-button"
                                onPress={() => handleCopy(createdFriendCode)}
                              >
                                {copiedCode === createdFriendCode
                                  ? "Copied"
                                  : "Copy"}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <Input
                            label="Join with a code"
                            placeholder="Enter code"
                            value={friendInviteCode}
                            onChange={(e) => setFriendInviteCode(e.target.value)}
                            variant="bordered"
                            classNames={inputClassNames}
                            className="sm:max-w-xs"
                          />
                          <Button
                            className="app-outline-button w-full sm:w-auto"
                            variant="bordered"
                            onPress={() => acceptFriendInviteMutation.mutate()}
                            isDisabled={!friendInviteCode.trim()}
                            isLoading={acceptFriendInviteMutation.isPending}
                          >
                            Join
                          </Button>
                        </div>
                        {acceptFriendInviteMutation.isError ? (
                          <p className="text-sm text-[#D77B69]" role="alert">
                            {acceptFriendInviteErrorDetail ||
                              "Unable to accept friend invite right now."}
                          </p>
                        ) : null}
                      </div>

                      <Divider className="bg-[#E0B15C]/10" />

                      <div>
                        <h3 className="text-lg font-semibold text-[#F7EAD2]">
                          Your friends
                        </h3>
                        {friends && friends.length > 0 ? (
                          <ul className="mt-3 divide-y app-rule">
                            {friends.map((friend) => (
                              <li
                                key={friend.id}
                                className="flex items-center gap-3 py-3"
                              >
                                <ArbiterAvatar
                                  user={friend}
                                  size="sm"
                                  label={
                                    friend.display_name ??
                                    friend.username ??
                                    friend.email ??
                                    "Friend"
                                  }
                                  className="bg-[#E0B15C]/20 text-[#E0B15C]"
                                />
                                <span className="text-sm text-[#F7EAD2]">
                                  {friend.display_name ??
                                    friend.username ??
                                    friend.email ??
                                    "Friend"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm app-muted">
                            No friends here yet. Share an invite to start choosing together.
                          </p>
                        )}
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
                                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E0B15C]/75">
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
                              <div className="flex flex-wrap items-center gap-3">
                                <Button
                                  className="app-outline-button"
                                  variant="bordered"
                                  onPress={() => createGroupInviteMutation.mutate()}
                                  isDisabled={!selectedGroup}
                                  isLoading={createGroupInviteMutation.isPending}
                                >
                                  Create group invite
                                </Button>
                                {createdGroupCode ? (
                                  <div className="flex items-center gap-2">
                                    <Chip
                                      radius="sm"
                                      size="lg"
                                      variant="flat"
                                      classNames={{
                                        base: "border-[#E0B15C]/35 bg-[#E0B15C]/10",
                                        content: "text-[#F5D9A5]",
                                      }}
                                    >
                                      {createdGroupCode}
                                    </Chip>
                                    <Button
                                      size="sm"
                                      variant="light"
                                      className="app-secondary-button"
                                      onPress={() => handleCopy(createdGroupCode)}
                                    >
                                      {copiedCode === createdGroupCode
                                        ? "Copied"
                                        : "Copy"}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
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
