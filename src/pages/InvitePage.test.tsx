import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import InvitePage from "./InvitePage";

const { acceptFriendLinkInvite } = vi.hoisted(() => ({
  acceptFriendLinkInvite: vi.fn(),
}));

vi.mock("../features/auth/auth.api", () => ({
  getMe: vi.fn(async () => ({ id: "invite-owner", display_name: "Test User" })),
}));
vi.mock("../features/friends/friends.api", () => ({
  acceptFriendLinkInvite,
  previewFriendInvite: vi.fn(async () => ({
    inviter: {
      id: "invite-owner",
      display_name: "Test User",
      username: "test-user",
      avatar_url: null,
      avatar_source: null,
      avatar_style: null,
      avatar_seed: null,
    },
    expires_at: "2099-01-01T00:00:00Z",
  })),
}));
vi.mock("../features/groups/groups.api", () => ({
  acceptGroupLinkInvite: vi.fn(),
  previewGroupInvite: vi.fn(),
}));
vi.mock("../components/ArbiterAvatar", () => ({
  default: () => <div aria-hidden="true" />,
}));
vi.mock("../components/BrandLockup", () => ({
  default: () => <span>Arbiter</span>,
}));

describe("InvitePage", () => {
  it("does not offer an invite creator a self-accept action", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter initialEntries={["/invite/friend/test-token"]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="/invite/friend/:token"
              element={<InvitePage type="friend" />}
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "This is your invitation. Share it with someone else to connect.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept invite" }),
    ).not.toBeInTheDocument();
    expect(acceptFriendLinkInvite).not.toHaveBeenCalled();
  });
});
