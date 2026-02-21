import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  acceptGroupInvite,
  createGroup,
} from "../../../features/groups/groups.api";
import { getFriends } from "../../../features/friends/friends.api";
import type { InputClassNames } from "../types";

type NoGroupsCardProps = {
  inputClassNames: InputClassNames;
};

export default function NoGroupsCard({ inputClassNames }: NoGroupsCardProps) {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [groupInviteCode, setGroupInviteCode] = useState("");
  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });

  const createGroupMutation = useMutation({
    mutationFn: () => createGroup({ name: groupName.trim() }),
    onSuccess: () => {
      setGroupName("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => acceptGroupInvite(groupInviteCode.trim()),
    onSuccess: () => {
      setGroupInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  return (
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-white">No groups yet</h2>
          <p className="text-sm text-[#D9C7A8]">
            Create a group or join with an invite code.
          </p>
        </div>
      </CardHeader>
      <CardBody className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Input
            label="New group name"
            placeholder="NERV squad"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            variant="bordered"
            classNames={inputClassNames}
          />
          <Button
            className="border-[#E0B15C]/50 text-[#E0B15C] hover:bg-[#E0B15C]/10"
            variant="bordered"
            onPress={() => createGroupMutation.mutate()}
            isDisabled={!groupName.trim()}
            isLoading={createGroupMutation.isPending}
          >
            Create Group
          </Button>
        </div>
        <div className="space-y-3">
          <Input
            label="Invite code"
            placeholder="Enter invite code"
            value={groupInviteCode}
            onChange={(event) => setGroupInviteCode(event.target.value)}
            variant="bordered"
            classNames={inputClassNames}
          />
          <Button
            className="border-[#E0B15C]/50 text-[#E0B15C] hover:bg-[#E0B15C]/10"
            variant="bordered"
            onPress={() => acceptInviteMutation.mutate()}
            isDisabled={!groupInviteCode.trim()}
            isLoading={acceptInviteMutation.isPending}
          >
            Accept Invite
          </Button>
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D9C7A8]">
            Friends Connected
          </p>
          {friends && friends.length > 0 ? (
            <ul className="space-y-1 text-sm text-[#F7F1E3]">
              {friends.map((friend) => (
                <li key={friend.id}>
                  {friend.display_name || friend.username || friend.email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#D9C7A8]">
              No friends yet. Open account menu to generate or accept friend
              invites.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
