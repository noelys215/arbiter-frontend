import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ArbiterAvatar from "../components/ArbiterAvatar";
import BrandLockup from "../components/BrandLockup";
import { getMe } from "../features/auth/auth.api";
import {
  acceptFriendLinkInvite,
  previewFriendInvite,
} from "../features/friends/friends.api";
import type { FriendInvitePreview } from "../features/friends/friends.api";
import {
  acceptGroupLinkInvite,
  previewGroupInvite,
} from "../features/groups/groups.api";
import type { GroupInvitePreview } from "../features/groups/groups.api";
import SkipLink from "../components/SkipLink";

type InvitePageProps = {
  type: "friend" | "group";
};

type InvitePreview = FriendInvitePreview | GroupInvitePreview;

export default function InvitePage({ type }: InvitePageProps) {
  const { token = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const previewQuery = useQuery<InvitePreview>({
    queryKey: ["invite-preview", type, token],
    queryFn: async () =>
      type === "friend"
        ? await previewFriendInvite(token)
        : await previewGroupInvite(token),
    retry: false,
  });
  const acceptMutation = useMutation<unknown, Error, void>({
    mutationFn: async () =>
      type === "friend"
        ? await acceptFriendLinkInvite(token)
        : await acceptGroupLinkInvite(token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friends"] }),
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["group-invitations"] }),
      ]);
    },
  });

  const invitePath = location.pathname;
  const signInHref = `/login?return_to=${encodeURIComponent(invitePath)}`;
  const preview = previewQuery.data;
  const inviter = preview?.inviter;
  const groupPreview = type === "group" && preview && "group_name" in preview
    ? (preview as GroupInvitePreview)
    : null;
  const title = groupPreview
    ? `Join ${groupPreview.group_name}`
    : inviter
      ? `${inviter.display_name} invited you to connect.`
      : "Your Arbiter invitation";

  return (
    <div className="min-h-screen bg-[#140C0A] text-[#F7F1E3]">
      <SkipLink />
      <header className="mx-auto flex w-full max-w-5xl px-5 py-6 sm:px-8">
        <Link to="/" aria-label="Arbiter home">
          <BrandLockup
            logoClassName="h-11 w-11"
            titleClassName="text-3xl"
            versionClassName="sr-only"
          />
        </Link>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl items-center px-5 pb-16 pt-8 sm:min-h-[72vh] sm:px-8"
      >
        <section className="w-full max-w-2xl border-l border-[#E0B15C]/35 pl-5 sm:pl-9">
          {previewQuery.isLoading ? (
            <div className="flex items-center gap-3" role="status">
              <Spinner size="sm" color="warning" />
              <span className="text-[#D9C7A8]">Opening invitation…</span>
            </div>
          ) : previewQuery.isError || !preview || !inviter ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C99A4A]">
                Invitation unavailable
              </p>
              <h1 className="font-serif text-4xl leading-tight text-[#F7EAD2] sm:text-5xl">
                This invitation can’t be used.
              </h1>
              <p className="max-w-lg text-base leading-7 text-[#D9C7A8]">
                It may have expired, been withdrawn, or already reached its limit.
              </p>
              <Button as={Link} to="/" className="app-outline-button" variant="bordered">
                Back to Arbiter
              </Button>
            </div>
          ) : (
            <div className="space-y-7">
              <div className="flex items-center gap-3">
                <ArbiterAvatar
                  user={inviter}
                  size="lg"
                  label={inviter.display_name ?? inviter.username ?? "Arbiter member"}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C99A4A]">
                    {type === "friend" ? "Friend invitation" : "Group invitation"}
                  </p>
                  <p className="mt-1 text-sm text-[#D9C7A8]">From {inviter.display_name}</p>
                </div>
              </div>
              <div>
                <h1 className="max-w-xl font-serif text-4xl leading-[1.08] text-[#F7EAD2] sm:text-6xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#D9C7A8] sm:text-lg">
                  {type === "friend"
                    ? "Connect to share groups and choose movie nights together."
                    : `${groupPreview?.member_count ?? 0} ${groupPreview?.member_count === 1 ? "person is" : "people are"} already choosing together.`}
                </p>
              </div>
              {acceptMutation.isSuccess ? (
                <div className="space-y-4" role="status" aria-live="polite">
                  <p className="text-[#F5D9A5]">
                    {type === "friend" ? "You’re connected." : "You joined the group."}
                  </p>
                  <Button className="app-primary-button" onPress={() => navigate("/app")}>Open Arbiter</Button>
                </div>
              ) : meQuery.data ? (
                <Button
                  className="app-primary-button"
                  isLoading={acceptMutation.isPending}
                  isDisabled={acceptMutation.isPending}
                  onPress={() => acceptMutation.mutate()}
                >
                  {type === "friend" ? "Accept invite" : "Join group"}
                </Button>
              ) : (
                <Button as={Link} to={signInHref} className="app-primary-button">
                  Sign in to continue
                </Button>
              )}
              {acceptMutation.isError ? (
                <p className="text-sm text-[#E69A88]" role="alert">
                  We couldn’t accept this invitation. Please try again.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
