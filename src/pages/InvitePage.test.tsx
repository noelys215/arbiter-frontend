import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvitePage from "./InvitePage";

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  acceptFriendLinkInvite: vi.fn(),
  previewFriendInvite: vi.fn(),
  acceptGroupLinkInvite: vi.fn(),
  previewGroupInvite: vi.fn(),
}));

const inviter = {
  id: "invite-owner",
  display_name: "Test User",
  username: "test-user",
  avatar_url: null,
  avatar_source: null,
  avatar_style: null,
  avatar_seed: null,
};

vi.mock("../features/auth/auth.api", () => ({ getMe: mocks.getMe }));
vi.mock("../features/friends/friends.api", () => ({
  acceptFriendLinkInvite: mocks.acceptFriendLinkInvite,
  previewFriendInvite: mocks.previewFriendInvite,
}));
vi.mock("../features/groups/groups.api", () => ({
  acceptGroupLinkInvite: mocks.acceptGroupLinkInvite,
  previewGroupInvite: mocks.previewGroupInvite,
}));
vi.mock("../components/ArbiterAvatar", () => ({
  default: () => <div aria-hidden="true" />,
}));

function apiError(detail: string, status: number) {
  return Object.assign(new Error(detail), { detail, status });
}

function renderInvite(type: "friend" | "group" = "friend") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const path = `/invite/${type}/test-token`;

  render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/invite/:type/:token"
            element={<InvitePage type={type} />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("InvitePage", () => {
  beforeEach(() => {
    mocks.getMe.mockResolvedValue({ id: "recipient", display_name: "Recipient" });
    mocks.previewFriendInvite.mockResolvedValue({
      inviter,
      expires_at: "2099-01-01T00:00:00Z",
    });
    mocks.previewGroupInvite.mockResolvedValue({
      group_id: "group-id",
      group_name: "Match Club",
      inviter,
      member_count: 3,
      expires_at: "2099-01-01T00:00:00Z",
      targeted: false,
    });
    mocks.acceptFriendLinkInvite.mockResolvedValue({
      ok: true,
      already_friends: false,
    });
    mocks.acceptGroupLinkInvite.mockResolvedValue({
      ok: true,
      decision: "accepted",
      already_member: false,
    });
  });

  it("does not offer an invite creator a self-accept action", async () => {
    mocks.getMe.mockResolvedValue({ id: "invite-owner", display_name: "Test User" });
    renderInvite();

    expect(await screen.findByRole("heading", { name: "This is your invitation." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept invite" })).not.toBeInTheDocument();
    expect(mocks.acceptFriendLinkInvite).not.toHaveBeenCalled();
  });

  it("preserves the friend invitation while signed out", async () => {
    mocks.getMe.mockRejectedValue(apiError("Unauthorized", 401));
    renderInvite();

    expect(
      await screen.findByRole("heading", {
        name: "Test User invited you to connect.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to accept" })).toHaveAttribute(
      "href",
      "/login?return_to=%2Finvite%2Ffriend%2Ftest-token",
    );
  });

  it("shows a dedicated friend success outcome", async () => {
    renderInvite();
    fireEvent.click(await screen.findByRole("button", { name: "Accept invite" }));

    expect(await screen.findByRole("heading", { name: "You’re connected." })).toBeInTheDocument();
    expect(screen.getByText("Test User is now in your friends list.")).toBeInTheDocument();
    expect(screen.queryByText("Test User invited you to connect.")).not.toBeInTheDocument();
  });

  it("distinguishes an existing friendship", async () => {
    mocks.acceptFriendLinkInvite.mockResolvedValue({
      ok: true,
      already_friends: true,
    });
    renderInvite();
    fireEvent.click(await screen.findByRole("button", { name: "Accept invite" }));

    expect(
      await screen.findByRole("heading", { name: "You’re already connected." }),
    ).toBeInTheDocument();
  });

  it("shows group context and a dedicated already-member outcome", async () => {
    mocks.acceptGroupLinkInvite.mockResolvedValue({
      ok: true,
      decision: "accepted",
      already_member: true,
    });
    renderInvite("group");

    expect(await screen.findByRole("heading", { name: "Join Match Club." })).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join group" }));
    expect(
      await screen.findByRole("heading", {
        name: "You’re already in Match Club.",
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ["expired_invite", 410, "This invitation has expired."],
    ["revoked_invite", 410, "This invitation is no longer available."],
    ["invalid_invite", 404, "This invitation can’t be opened."],
  ])("presents %s without exposing the error identifier", async (detail, status, headline) => {
    mocks.previewFriendInvite.mockRejectedValue(apiError(detail, status));
    renderInvite();

    expect(await screen.findByRole("heading", { name: headline })).toBeInTheDocument();
    expect(screen.queryByText(detail)).not.toBeInTheDocument();
  });

  it("keeps a temporary acceptance failure retryable", async () => {
    mocks.acceptFriendLinkInvite
      .mockRejectedValueOnce(apiError("Service unavailable", 503))
      .mockResolvedValueOnce({ ok: true, already_friends: false });
    renderInvite();

    fireEvent.click(await screen.findByRole("button", { name: "Accept invite" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t accept this invitation. Please try again.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept invite" }));
    expect(await screen.findByRole("heading", { name: "You’re connected." })).toBeInTheDocument();
  });
});
