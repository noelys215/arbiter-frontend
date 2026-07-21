import { Card, Separator } from "@heroui/react";
import ArbiterAvatar from "../../../components/ArbiterAvatar";
import type { MeResponse } from "../../../features/auth/auth.api";

type UserSummaryCardProps = {
  me: MeResponse | undefined;
};

export default function UserSummaryCard({ me }: UserSummaryCardProps) {
  return (
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <Card.Header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D9C7A8]">
            User summary
          </p>
          <h2 className="text-lg font-semibold">Signed in</h2>
        </div>
        <ArbiterAvatar
          user={me}
          size="md"
          className="bg-[#E0B15C] text-[#1C110F]"
        />
      </Card.Header>
      <Separator className="bg-[#E0B15C]/15" />
      <Card.Content className="grid gap-3 text-sm text-white/90 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D9C7A8]">
            Name
          </p>
          <p>{me?.display_name ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D9C7A8]">
            Email
          </p>
          <p>{me?.email ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D9C7A8]">
            User ID
          </p>
          <p className="break-all">{me?.id ?? "-"}</p>
        </div>
      </Card.Content>
    </Card>
  );
}
