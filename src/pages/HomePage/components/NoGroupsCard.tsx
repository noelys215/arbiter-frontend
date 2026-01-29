import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  acceptGroupInvite,
  createGroup,
} from "../../../features/groups/groups.api";
import type { InputClassNames } from "../types";

type NoGroupsCardProps = {
  inputClassNames: InputClassNames;
};

export default function NoGroupsCard({ inputClassNames }: NoGroupsCardProps) {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [groupInviteCode, setGroupInviteCode] = useState("");

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
    <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-white">No groups yet</h2>
          <p className="text-sm text-[#A0A0A0]">
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
            className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
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
            className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            variant="bordered"
            onPress={() => acceptInviteMutation.mutate()}
            isDisabled={!groupInviteCode.trim()}
            isLoading={acceptInviteMutation.isPending}
          >
            Accept Invite
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
