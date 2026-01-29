import {
  Avatar,
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../features/auth/auth.api";
import type { MeResponse } from "../../../features/auth/auth.api";
import {
  acceptFriendInvite,
  createFriendInvite,
} from "../../../features/friends/friends.api";
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

type AvatarMenuModalProps = {
  isOpen: boolean;
  onOpenChange: OnOpenChange;
  me: MeResponse | undefined;
  selectedGroup: Group | null;
  onGroupCleared: () => void;
};

const inputClassNames: InputClassNames = {
  label: "text-[#D4AF37]/80",
  input: "text-white placeholder:text-white/40",
  inputWrapper:
    "border-[#D4AF37]/20 bg-[#0F0F10] focus-within:border-[#D4AF37]",
};

export default function AvatarMenuModal({
  isOpen,
  onOpenChange,
  me,
  selectedGroup,
  onGroupCleared,
}: AvatarMenuModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmModal = useDisclosure();

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
    onSuccess: () => {
      setFriendInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

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
          base: "bg-[#0B0B0B] border border-[#D4AF37]/20",
          header: "border-b border-[#D4AF37]/10",
          body: "py-6",
          footer: "border-t border-[#D4AF37]/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <Avatar
                  size="md"
                  radius="sm"
                  isBordered
                  src={me?.avatar_url ?? undefined}
                  name={me?.display_name ?? me?.username ?? "User"}
                  className="bg-[#D4AF37] text-black"
                />
                <div>
                  <h2 className="text-lg font-semibold text-white">Account</h2>
                  <p className="text-sm text-[#A0A0A0]">
                    Manage your profile, invites, and groups
                  </p>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-6">
                {/* User Summary */}
                <section className="rounded-xl border border-white/10 bg-[#0F0F10] p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    User Info
                  </h3>
                  <div className="grid gap-3 text-sm text-white/90 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-[#A0A0A0]">
                        Name
                      </p>
                      <p>{me?.display_name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-[#A0A0A0]">
                        Username
                      </p>
                      <p>{me?.username ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-[#A0A0A0]">
                        Email
                      </p>
                      <p>{me?.email ?? "-"}</p>
                    </div>
                  </div>
                </section>

                <Divider className="bg-[#D4AF37]/10" />

                {/* Friend Invites */}
                <section className="rounded-xl border border-white/10 bg-[#0F0F10] p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    Friend Invites
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        variant="bordered"
                        onPress={() => createFriendInviteMutation.mutate()}
                        isLoading={createFriendInviteMutation.isPending}
                      >
                        Generate invite code
                      </Button>
                      {createdFriendCode ? (
                        <div className="flex items-center gap-2">
                          <Chip
                            variant="bordered"
                            classNames={{
                              base: "border-[#D4AF37]/50",
                              content: "text-[#D4AF37]",
                            }}
                          >
                            {createdFriendCode}
                          </Chip>
                          <Button
                            size="sm"
                            variant="bordered"
                            className="border-[#D4AF37]/30 text-[#D4AF37]"
                            onPress={() => handleCopy(createdFriendCode)}
                          >
                            {copiedCode === createdFriendCode
                              ? "Copied"
                              : "Copy"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <Input
                        label="Accept friend invite"
                        placeholder="Enter code"
                        value={friendInviteCode}
                        onChange={(e) => setFriendInviteCode(e.target.value)}
                        variant="bordered"
                        classNames={inputClassNames}
                        className="max-w-xs"
                      />
                      <Button
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        variant="bordered"
                        onPress={() => acceptFriendInviteMutation.mutate()}
                        isDisabled={!friendInviteCode.trim()}
                        isLoading={acceptFriendInviteMutation.isPending}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </section>

                <Divider className="bg-[#D4AF37]/10" />

                {/* Group Invites */}
                <section className="rounded-xl border border-white/10 bg-[#0F0F10] p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    Group Invites
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        variant="bordered"
                        onPress={() => createGroupInviteMutation.mutate()}
                        isDisabled={!selectedGroup}
                        isLoading={createGroupInviteMutation.isPending}
                      >
                        Generate Group Invite
                      </Button>
                      {createdGroupCode ? (
                        <div className="flex items-center gap-2">
                          <Chip
                            radius="sm"
                            size="lg"
                            variant="flat"
                            classNames={{
                              base: "border-[#D4AF37]/50",
                              content: "text-[#D4AF37]",
                            }}
                          >
                            {createdGroupCode}
                          </Chip>
                          <Button
                            size="sm"
                            variant="bordered"
                            className="border-[#D4AF37]/30 text-[#D4AF37]"
                            onPress={() => handleCopy(createdGroupCode)}
                          >
                            {copiedCode === createdGroupCode
                              ? "Copied"
                              : "Copy"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <Input
                        label="Join group via invite"
                        placeholder="Enter code"
                        value={groupInviteCode}
                        onChange={(e) => setGroupInviteCode(e.target.value)}
                        variant="bordered"
                        classNames={inputClassNames}
                        className="max-w-xs"
                      />
                      <Button
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        variant="bordered"
                        onPress={() => acceptGroupInviteMutation.mutate()}
                        isDisabled={!groupInviteCode.trim()}
                        isLoading={acceptGroupInviteMutation.isPending}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </section>

                <Divider className="bg-[#D4AF37]/10" />

                {/* Create Group */}
                <section className="rounded-xl border border-white/10 bg-[#0F0F10] p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    Create New Group
                  </h3>
                  <div className="flex flex-wrap items-end gap-3">
                    <Input
                      label="Group name"
                      placeholder="Group Name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      variant="bordered"
                      classNames={inputClassNames}
                      className="max-w-xs"
                    />
                    <Button
                      className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      variant="bordered"
                      onPress={() => createGroupMutation.mutate()}
                      isDisabled={!groupName.trim()}
                      isLoading={createGroupMutation.isPending}
                    >
                      Create Group
                    </Button>
                  </div>
                </section>

                {/* Group Actions (only if group selected) */}
                {selectedGroup ? (
                  <>
                    <Divider className="bg-[#D4AF37]/10" />
                    <section className="rounded-xl border border-[#7B1E2B]/30 bg-[#0F0F10] p-4">
                      <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#7B1E2B]">
                        Group Actions — {selectedGroup.name}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {isOwner ? (
                          <Button
                            className="border-[#7B1E2B]/50 text-[#7B1E2B] hover:bg-[#7B1E2B]/10"
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
                            className="border-[#7B1E2B]/50 text-[#7B1E2B] hover:bg-[#7B1E2B]/10"
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
                    </section>
                  </>
                ) : null}
              </ModalBody>
              <ModalFooter className="justify-between">
                <Button
                  variant="light"
                  className="text-[#A0A0A0] hover:text-white"
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  className="border-[#7B1E2B]/50 text-[#7B1E2B] hover:bg-[#7B1E2B]/10"
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
    </>
  );
}
