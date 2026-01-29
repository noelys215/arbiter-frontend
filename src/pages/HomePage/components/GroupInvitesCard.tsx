import { Button, Card, CardBody, CardHeader, Chip, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  acceptGroupInvite,
  createGroupInvite,
} from "../../../features/groups/groups.api";
import type { InputClassNames } from "../types";

type GroupInvitesCardProps = {
  selectedGroupId: string | null;
  inputClassNames: InputClassNames;
};

export default function GroupInvitesCard({
  selectedGroupId,
  inputClassNames,
}: GroupInvitesCardProps) {
  const queryClient = useQueryClient();
  const [groupInviteCode, setGroupInviteCode] = useState("");
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const createInviteMutation = useMutation({
    mutationFn: () =>
      selectedGroupId ? createGroupInvite(selectedGroupId) : Promise.reject(),
    onSuccess: (data) => {
      setCreatedGroupCode(data.code);
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => acceptGroupInvite(groupInviteCode.trim()),
    onSuccess: () => {
      setGroupInviteCode("");
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

  return (
    <Card className="border border-white/10 bg-black">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold">Group Invites</h2>
          <p className="text-sm text-white/70">
            Share or join groups with a code.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="bg-white text-black"
            onPress={() => createInviteMutation.mutate()}
            isDisabled={!selectedGroupId}
            isLoading={createInviteMutation.isPending}
          >
            Create group invite code
          </Button>
          {createdGroupCode ? (
            <div className="flex items-center gap-2">
              <Chip variant="bordered">{createdGroupCode}</Chip>
              <Button
                size="sm"
                variant="bordered"
                onPress={() => handleCopy(createdGroupCode)}
              >
                {copiedCode === createdGroupCode ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Input
            label="Join group via invite"
            placeholder="Code"
            value={groupInviteCode}
            onChange={(event) => setGroupInviteCode(event.target.value)}
            variant="bordered"
            classNames={inputClassNames}
          />
          <Button
            className="bg-white text-black"
            onPress={() => acceptInviteMutation.mutate()}
            isDisabled={!groupInviteCode.trim()}
            isLoading={acceptInviteMutation.isPending}
          >
            Join
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
