import { Avatar, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import type { MeResponse } from "../../../features/auth/auth.api";

type UserSummaryCardProps = {
  me: MeResponse | undefined;
};

export default function UserSummaryCard({ me }: UserSummaryCardProps) {
  return (
    <Card className="border border-white/10 bg-black">
      <CardHeader className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            User summary
          </p>
          <h2 className="text-lg font-semibold">Signed in</h2>
        </div>
        <Avatar
          size="md"
          src={me?.avatar_url ?? undefined}
          name={me?.display_name ?? me?.username ?? "User"}
          className="bg-white text-black"
        />
      </CardHeader>
      <Divider className="bg-white/10" />
      <CardBody className="grid gap-3 text-sm text-white/90 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            Name
          </p>
          <p>{me?.display_name ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            Email
          </p>
          <p>{me?.email ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            User ID
          </p>
          <p className="break-all">{me?.id ?? "-"}</p>
        </div>
      </CardBody>
    </Card>
  );
}
