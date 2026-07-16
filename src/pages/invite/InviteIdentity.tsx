import ArbiterAvatar from "../../components/ArbiterAvatar";
import type { AvatarUser } from "../../features/avatar/avatarTypes";

type InviteIdentityProps = {
  type: "friend" | "group";
  inviter?: AvatarUser | null;
  memberCount?: number;
  eyebrow?: string;
};

export default function InviteIdentity({
  type,
  inviter,
  memberCount,
  eyebrow,
}: InviteIdentityProps) {
  const displayName = inviter?.display_name || inviter?.username || "Arbiter member";
  const username = inviter?.username;

  return (
    <div className="invite-identity">
      <p className="invite-eyebrow">
        {eyebrow ?? (type === "friend" ? "Friend invitation" : "Group invitation")}
      </p>
      {inviter ? (
        <div className="invite-person">
          <ArbiterAvatar user={inviter} size={64} label={displayName} />
          <div className="min-w-0">
            <p className="invite-person-name">{displayName}</p>
            {username && username !== displayName ? (
              <p className="invite-person-username">@{username}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="invite-identity-label">Arbiter invitation</p>
      )}
      {type === "group" && typeof memberCount === "number" ? (
        <p className="invite-member-count">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
      ) : null}
    </div>
  );
}
