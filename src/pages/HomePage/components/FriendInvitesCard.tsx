import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  acceptFriendInvite,
  createFriendInvite,
  unfriend,
} from "../../../features/friends/friends.api";
import type { Friend } from "../../../features/friends/friends.api";
import ConfirmActionModal from "./ConfirmActionModal";
import type { ConfirmAction, InputClassNames } from "../types";

type FriendInvitesCardProps = {
  friends: Friend[] | undefined;
  inputClassNames: InputClassNames;
};

export default function FriendInvitesCard({
  friends,
  inputClassNames,
}: FriendInvitesCardProps) {
  const queryClient = useQueryClient();
  const confirmModal = useDisclosure();
  const [friendInviteCode, setFriendInviteCode] = useState("");
  const [createdFriendCode, setCreatedFriendCode] = useState<string | null>(
    null,
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [pendingUnfriendId, setPendingUnfriendId] = useState<string | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const createInviteMutation = useMutation({
    mutationFn: createFriendInvite,
    onSuccess: (data) => {
      setCreatedFriendCode(data.code);
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => acceptFriendInvite(friendInviteCode.trim()),
    onSuccess: () => {
      setFriendInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
  const acceptInviteErrorDetail =
    acceptInviteMutation.error &&
    typeof acceptInviteMutation.error === "object" &&
    "detail" in acceptInviteMutation.error &&
    typeof (acceptInviteMutation.error as { detail?: unknown }).detail ===
      "string"
      ? (acceptInviteMutation.error as { detail?: string }).detail
      : null;

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
    unfriendMutation.mutate(confirmAction.id);
    confirmModal.onClose();
    setConfirmAction(null);
  };

  return (
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold">Friend Invites</h2>
          <p className="text-sm text-[#D9C7A8]">
            Share codes to connect with friends.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="bg-[#E0B15C] text-[#1C110F]"
            onPress={() => createInviteMutation.mutate()}
            isLoading={createInviteMutation.isPending}
          >
            Generate invite code
          </Button>
          {createdFriendCode ? (
            <div className="flex items-center gap-2">
              <Chip variant="bordered">{createdFriendCode}</Chip>
              <Button
                size="sm"
                variant="bordered"
                onPress={() => handleCopy(createdFriendCode)}
              >
                {copiedCode === createdFriendCode ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Input
            label="Accept friend invite"
            placeholder="Code"
            value={friendInviteCode}
            onChange={(event) => setFriendInviteCode(event.target.value)}
            variant="bordered"
            classNames={inputClassNames}
          />
          <Button
            className="bg-[#E0B15C] text-[#1C110F]"
            onPress={() => acceptInviteMutation.mutate()}
            isDisabled={!friendInviteCode.trim()}
            isLoading={acceptInviteMutation.isPending}
          >
            Accept
          </Button>
        </div>
        {acceptInviteMutation.isError ? (
          <p className="text-sm text-[#D77B69]" role="alert">
            {acceptInviteErrorDetail ||
              "Unable to accept friend invite right now."}
          </p>
        ) : null}
        {friends && friends.length > 0 ? (
          <div className="space-y-2 text-sm text-[#F7F1E3]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#D9C7A8]">
              Friends
            </p>
            <ul className="space-y-1">
              {friends.map((friend) => {
                const label =
                  friend.display_name ??
                  friend.username ??
                  friend.email ??
                  friend.id;
                return (
                  <li
                    key={friend.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{label}</span>
                    <Button
                      size="sm"
                      variant="bordered"
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
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardBody>
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onOpenChange={confirmModal.onOpenChange}
        confirmAction={confirmAction}
        onConfirm={handleConfirm}
        isLoading={unfriendMutation.isPending}
      />
    </Card>
  );
}
