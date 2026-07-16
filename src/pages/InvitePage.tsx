import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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
import InviteActions from "./invite/InviteActions";
import InviteIdentity from "./invite/InviteIdentity";
import InviteShell from "./invite/InviteShell";
import {
  classifyInviteError,
  failurePresentation,
} from "./invite/invitePresentation";

type InvitePageProps = {
  type: "friend" | "group";
};

type InvitePreview = FriendInvitePreview | GroupInvitePreview;
type FriendAcceptResult = Awaited<ReturnType<typeof acceptFriendLinkInvite>>;
type GroupAcceptResult = Awaited<ReturnType<typeof acceptGroupLinkInvite>>;
type InviteAcceptResult = FriendAcceptResult | GroupAcceptResult;

export default function InvitePage({ type }: InvitePageProps) {
  const { token = "" } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const outcomeHeadingRef = useRef<HTMLHeadingElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const previewQuery = useQuery<InvitePreview>({
    queryKey: ["invite-preview", type, token],
    queryFn: async () =>
      type === "friend"
        ? await previewFriendInvite(token)
        : await previewGroupInvite(token),
    retry: false,
  });
  const acceptMutation = useMutation<InviteAcceptResult, Error, void>({
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
  const groupPreview =
    type === "group" && preview && "group_name" in preview
      ? (preview as GroupInvitePreview)
      : null;
  const isOwnFriendInvite =
    type === "friend" && Boolean(inviter && meQuery.data?.id === inviter.id);
  const acceptFailure = acceptMutation.isError
    ? classifyInviteError(acceptMutation.error)
    : null;
  const terminalAcceptFailure =
    acceptFailure && acceptFailure !== "temporary" ? acceptFailure : null;

  useEffect(() => {
    if (acceptMutation.isSuccess || terminalAcceptFailure) {
      outcomeHeadingRef.current?.focus();
    }
  }, [acceptMutation.isSuccess, terminalAcceptFailure]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("Invite link copied.");
    } catch {
      setCopyStatus("We couldn’t copy the link. Copy it from your address bar instead.");
    }
  };

  if (previewQuery.isPending) {
    return (
      <InviteShell
        identity={<InviteIdentity type={type} eyebrow="Opening invitation" />}
        headline="Your invitation is almost ready."
        body="We’re gathering the details now."
        status={
          <div className="invite-loading" role="status" aria-live="polite">
            <Spinner size="sm" color="warning" />
            <span>Opening invitation…</span>
          </div>
        }
      />
    );
  }

  if (previewQuery.isError || !preview || !inviter) {
    const failure = classifyInviteError(previewQuery.error);
    const presentation = failurePresentation(failure);
    return (
      <InviteShell
        identity={<InviteIdentity type={type} eyebrow={presentation.eyebrow} />}
        headline={presentation.headline}
        body={presentation.body}
        actions={
          failure === "temporary" ? (
            <InviteActions
              primaryLabel="Try again"
              onPrimaryPress={() => void previewQuery.refetch()}
              isPending={previewQuery.isFetching}
              secondaryLabel="Back to Arbiter"
              secondaryHref="/"
            />
          ) : (
            <InviteActions
              primaryLabel="Back to Arbiter"
              primaryHref="/"
            />
          )
        }
      />
    );
  }

  if (terminalAcceptFailure) {
    const presentation = failurePresentation(terminalAcceptFailure);
    return (
      <InviteShell
        headingRef={outcomeHeadingRef}
        identity={
          <InviteIdentity
            type={type}
            inviter={inviter}
            memberCount={groupPreview?.member_count}
            eyebrow={presentation.eyebrow}
          />
        }
        headline={presentation.headline}
        body={presentation.body}
        actions={
          <InviteActions primaryLabel="Go to Arbiter" primaryHref="/app" />
        }
      />
    );
  }

  if (acceptMutation.isSuccess) {
    const alreadyConnected =
      type === "friend" &&
      "already_friends" in acceptMutation.data &&
      acceptMutation.data.already_friends;
    const alreadyMember =
      type === "group" &&
      "already_member" in acceptMutation.data &&
      acceptMutation.data.already_member;
    const headline = alreadyConnected
      ? "You’re already connected."
      : alreadyMember
        ? `You’re already in ${groupPreview?.group_name}.`
        : type === "friend"
          ? "You’re connected."
          : "You’re in.";
    const body =
      type === "friend"
        ? `${inviter.display_name} is ${alreadyConnected ? "already" : "now"} in your friends list.`
        : alreadyMember
          ? `${groupPreview?.group_name} is already one of your groups.`
          : `You’ve joined ${groupPreview?.group_name}.`;

    return (
      <InviteShell
        headingRef={outcomeHeadingRef}
        identity={
          <InviteIdentity
            type={type}
            inviter={inviter}
            memberCount={groupPreview?.member_count}
            eyebrow={type === "friend" ? "Invitation accepted" : "Welcome to the group"}
          />
        }
        headline={headline}
        body={body}
        status={<span className="sr-only" role="status">{headline}</span>}
        actions={
          <InviteActions primaryLabel="Go to Arbiter" primaryHref="/app" />
        }
      />
    );
  }

  if (isOwnFriendInvite) {
    return (
      <InviteShell
        identity={<InviteIdentity type={type} inviter={inviter} />}
        headline="This is your invitation."
        body="Share it with someone you’d like to connect with."
        status={
          copyStatus ? (
            <p
              className={copyStatus === "Invite link copied." ? "invite-copy-success" : "invite-error"}
              role="status"
              aria-live="polite"
            >
              {copyStatus}
            </p>
          ) : null
        }
        actions={
          <>
            <Button className="invite-primary-action" onPress={() => void copyInviteLink()}>
              Copy invite link
            </Button>
            <Link to="/app" className="invite-secondary-action">
              Back to Arbiter
            </Link>
          </>
        }
      />
    );
  }

  const headline =
    type === "friend"
      ? `${inviter.display_name} invited you to connect.`
      : `Join ${groupPreview?.group_name}.`;
  const body =
    type === "friend"
      ? "You’ll be able to invite each other to groups and plan movie nights together."
      : `${inviter.display_name} invited you to help choose what the group watches next.`;
  const isSignedIn = Boolean(meQuery.data);

  return (
    <InviteShell
      identity={
        <InviteIdentity
          type={type}
          inviter={inviter}
          memberCount={groupPreview?.member_count}
        />
      }
      headline={headline}
      body={body}
      status={
        acceptFailure === "temporary" ? (
          <p className="invite-error" role="alert">
            We couldn’t accept this invitation. Please try again.
          </p>
        ) : null
      }
      actions={
        meQuery.isPending ? (
          <div className="invite-auth-pending" role="status" aria-live="polite">
            Checking your sign-in…
          </div>
        ) : isSignedIn ? (
          <InviteActions
            primaryLabel={type === "friend" ? "Accept invite" : "Join group"}
            onPrimaryPress={() => acceptMutation.mutate()}
            isPending={acceptMutation.isPending}
            secondaryLabel="Not now"
            secondaryHref="/app"
          />
        ) : (
          <InviteActions
            primaryLabel={type === "friend" ? "Sign in to accept" : "Sign in to join"}
            primaryHref={signInHref}
            secondaryLabel="Back to Arbiter"
            secondaryHref="/"
          />
        )
      }
    />
  );
}
