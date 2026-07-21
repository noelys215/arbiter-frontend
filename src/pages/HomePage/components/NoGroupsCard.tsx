import { Button, Card } from "@heroui/react";
import { AppTextField } from "../../../components/ui/AppField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createGroup } from "../../../features/groups/groups.api";
import type { InputClassNames } from "../types";

type NoGroupsCardProps = {
  inputClassNames: InputClassNames;
};

export default function NoGroupsCard({ inputClassNames }: NoGroupsCardProps) {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");

  const createGroupMutation = useMutation({
    mutationFn: () => createGroup({ name: groupName.trim() }),
    onSuccess: () => {
      setGroupName("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  return (
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <Card.Header>
        <div>
          <h2 className="text-lg font-semibold text-white">No groups yet</h2>
          <p className="text-sm text-[#D9C7A8]">
            Create one when you’re ready to plan a movie night.
          </p>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          <AppTextField
            label="New group name"
            placeholder="NERV squad"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            classes={inputClassNames}
          />
          <Button
            className="border-[#E0B15C]/50 text-[#E0B15C] hover:bg-[#E0B15C]/10"
            variant="secondary"
            onPress={() => createGroupMutation.mutate()}
            isDisabled={!groupName.trim()}
            isPending={createGroupMutation.isPending}
          >
            Create Group
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
