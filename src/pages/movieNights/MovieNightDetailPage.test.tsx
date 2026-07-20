import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedSession } from "../../features/sessions/sessions.api";
import MovieNightDetailPage from "./MovieNightDetailPage";

const { updateSessionWatchedStatus } = vi.hoisted(() => ({
  updateSessionWatchedStatus: vi.fn(),
}));

vi.mock("../../features/auth/auth.api", () => ({
  getMe: vi.fn(async () => ({ id: "user-a", display_name: "Henry" })),
}));
vi.mock("../../features/groups/groups.api", () => ({
  getGroup: vi.fn(async () => ({
    id: "group-a",
    name: "Match Club",
    owner_id: "user-a",
  })),
}));
vi.mock("../../features/sessions/moodCues.api", () => ({
  getMoodCues: vi.fn(async () => [
    {
      id: "date-night",
      label: "Date night",
      description: "A night for two.",
      category: "occasion",
      display_order: 1,
    },
  ]),
}));
vi.mock("../../features/sessions/sessions.api", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../../features/sessions/sessions.api")
  >();
  return {
    ...original,
    getSessionCompletion: vi.fn(async () => completedNight),
    updateSessionWatchedStatus,
  };
});
vi.mock("../../components/ArbiterAvatar", () => ({
  default: ({ label }: { label?: string }) => <span>{label ?? "Avatar"}</span>,
}));
vi.mock("./MovieNightsShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const completedNight: CompletedSession = {
  session_id: "night-a",
  group_id: "group-a",
  group_name: "Match Club",
  status: "completed",
  created_at: "2026-07-20T20:00:00Z",
  started_at: "2026-07-20T20:01:00Z",
  winner_selected_at: "2026-07-20T20:08:00Z",
  completed_at: "2026-07-20T20:09:00Z",
  criteria: {
    mood_cues: ["date-night"],
    custom_mood_text: "Something romantic but not cheesy.",
  },
  winner_candidate_id: "candidate-a",
  decision_duration_seconds: 420,
  winner_unanimous: true,
  had_tie: false,
  tie_resolution: null,
  watched_status: "unconfirmed",
  watched_confirmed_at: null,
  teleparty_was_shared: true,
  teleparty_shared_at: "2026-07-20T20:10:00Z",
  teleparty_handoff_at: "2026-07-20T20:11:00Z",
  participants: [
    {
      id: "participant-a",
      user_id: "user-a",
      display_name: "Henry",
      avatar_url: null,
      avatar_source: "initials",
      avatar_style: null,
      avatar_seed: null,
      joined_at: "2026-07-20T20:00:00Z",
      submitted_votes: true,
      role: "host",
      participation_status: "participated",
      criteria: null,
    },
  ],
  candidates: [
    {
      id: "candidate-a",
      source_watchlist_item_id: "watchlist-a",
      source: "tmdb",
      source_id: "1",
      media_type: "movie",
      title: "Get Out",
      release_year: 2017,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: 104,
      genres: ["Horror", "Mystery"],
      overview: null,
      position: 0,
      yes_count: 1,
      no_count: 0,
      total_vote_count: 1,
      is_winner: true,
      is_finalist: true,
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter
      initialEntries={["/app/groups/group-a/movie-nights/night-a"]}
    >
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/app/groups/:groupId/movie-nights/:sessionId"
            element={<MovieNightDetailPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("MovieNightDetailPage", () => {
  beforeEach(() => {
    updateSessionWatchedStatus.mockReset();
    updateSessionWatchedStatus.mockResolvedValue({
      ...completedNight,
      watched_status: "watched",
    });
  });

  it("renders historical context and permits watched confirmation", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Get Out" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Date night")).toBeInTheDocument();
    expect(
      screen.getByText(/Something romantic but not cheesy\./),
    ).toBeInTheDocument();
    expect(screen.getByText("Watch party launched")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Watched$/ }));
    await waitFor(() =>
      expect(updateSessionWatchedStatus).toHaveBeenCalledWith(
        "night-a",
        "watched",
      ),
    );
  });
});
