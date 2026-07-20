import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedSession } from "../../features/sessions/sessions.api";
import MovieNightsPage from "./MovieNightsPage";

const { getGroupMovieNights } = vi.hoisted(() => ({
  getGroupMovieNights: vi.fn(),
}));

vi.mock("../../features/groups/groups.api", () => ({
  getGroup: vi.fn(async () => ({ id: "group-a", name: "Match Club" })),
}));
vi.mock("../../features/sessions/moodCues.api", () => ({
  getMoodCues: vi.fn(async () => [
    {
      id: "easygoing",
      label: "Easygoing",
      description: "An unhurried night.",
      category: "energy",
      display_order: 1,
    },
  ]),
}));
vi.mock("../../features/sessions/sessions.api", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../../features/sessions/sessions.api")
  >();
  return { ...original, getGroupMovieNights };
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
  criteria: { mood_cues: ["easygoing"] },
  winner_candidate_id: "candidate-a",
  decision_duration_seconds: 420,
  winner_unanimous: true,
  had_tie: false,
  tie_resolution: null,
  watched_status: "watched",
  watched_confirmed_at: "2026-07-20T22:00:00Z",
  teleparty_was_shared: false,
  teleparty_shared_at: null,
  teleparty_handoff_at: null,
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
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/app/groups/group-a/movie-nights"]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/app/groups/:groupId/movie-nights"
            element={<MovieNightsPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("MovieNightsPage", () => {
  beforeEach(() => getGroupMovieNights.mockReset());

  it("shows an intentional empty state", async () => {
    getGroupMovieNights.mockResolvedValue({ items: [], next_cursor: null });
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Your movie nights will collect here.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start a movie night" }),
    ).toBeInTheDocument();
  });

  it("renders a completed night as a navigable archive entry", async () => {
    getGroupMovieNights.mockResolvedValue({
      items: [completedNight],
      next_cursor: null,
    });
    renderPage();

    expect(await screen.findByRole("link", { name: /Get Out/ })).toHaveAttribute(
      "href",
      "/app/groups/group-a/movie-nights/night-a",
    );
    expect(screen.getByText("Easygoing")).toBeInTheDocument();
    expect(screen.getByText("1 participant")).toBeInTheDocument();
    expect(screen.getByText("Watched")).toBeInTheDocument();
  });
});
