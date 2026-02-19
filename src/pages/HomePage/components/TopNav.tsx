import { Avatar, Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../features/auth/auth.api";
import type { MeResponse } from "../../../features/auth/auth.api";
import type { Group } from "../../../features/groups/groups.api";

type TopNavProps = {
  groups: Group[] | undefined;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  me: MeResponse | undefined;
};

export default function TopNav({
  groups,
  selectedGroupId,
  onSelectGroup,
  me,
}: TopNavProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center">
        <img
          src="/arbiter.png"
          alt="Arbiter"
          className="h-64 w-64 rounded-sm object-contain"
        />
        <span className="text-xl font-semibold">Arbiter</span>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <label className="text-xs uppercase tracking-[0.3em] text-[#D9C7A8]">
          Group
        </label>
        <select
          className="min-w-[220px] rounded-md border border-[#E0B15C]/30 bg-[#22130F] px-3 py-2 text-sm text-[#E0B15C] focus:border-[#E0B15C] focus:ring-1 focus:ring-[#E0B15C]/50 focus:outline-none"
          value={selectedGroupId ?? ""}
          onChange={(event) => onSelectGroup(event.target.value)}
          disabled={!groups || groups.length === 0}
        >
          {(groups ?? []).map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Avatar
          size="sm"
          src={me?.avatar_url ?? undefined}
          name={me?.display_name ?? me?.username ?? "User"}
          className="bg-[#E0B15C] text-[#1C110F]"
        />
        <div className="text-right text-xs">
          <p className="font-semibold">
            {me?.display_name ?? me?.username ?? "User"}
          </p>
          <p className="text-[#F7F1E3]">{me?.email ?? ""}</p>
        </div>
        <Button
          className="bg-[#E0B15C] text-[#1C110F]"
          size="sm"
          onPress={() => logoutMutation.mutate()}
          isLoading={logoutMutation.isPending}
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}
