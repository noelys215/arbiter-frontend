import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

vi.mock("../features/auth/auth.api", () => ({
  getMe: vi.fn(async () => ({ id: "me", display_name: "Test User" })),
}));
vi.mock("../features/groups/groups.api", () => ({
  getGroups: vi.fn(async () => []),
}));
vi.mock("../features/friends/friends.api", () => ({
  getFriends: vi.fn(async () => [
    { id: "friend", display_name: "Existing Friend", username: "friend" },
  ]),
}));
vi.mock("../features/watchlist/watchlist.api", () => ({
  getGroupWatchlistPage: vi.fn(),
  searchTmdb: vi.fn(),
}));
vi.mock("./HomePage/hooks/useWatchlistRealtime", () => ({
  useWatchlistRealtime: vi.fn(),
}));
vi.mock("./HomePage/components/TopBar", () => ({
  default: () => <button>Account controls</button>,
}));
vi.mock("./HomePage/components/NoGroupsCard", () => ({
  default: () => <section>No groups yet</section>,
}));
vi.mock("./HomePage/components/RightRail", () => ({
  default: ({ friends }: { friends?: unknown[] }) => (
    <aside>Friends visible: {friends?.length ?? 0}</aside>
  ),
}));
vi.mock("./HomePage/components/AvatarMenuModal", () => ({
  default: () => <div>Account modal available</div>,
}));
vi.mock("./HomePage/components/ManualAddModal", () => ({
  default: () => null,
}));

describe("HomePage with zero groups", () => {
  beforeEach(() => localStorage.clear());

  it("keeps account-level social features mounted", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <HomePage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No groups yet")).toBeInTheDocument();
    expect(screen.getByText("Friends visible: 1")).toBeInTheDocument();
    expect(screen.getByText("Account controls")).toBeInTheDocument();
    expect(screen.getByText("Account modal available")).toBeInTheDocument();
  });
});
