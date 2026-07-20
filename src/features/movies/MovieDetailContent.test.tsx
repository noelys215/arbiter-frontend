import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { MovieDetail } from "./movies.api";
import MovieDetailContent from "./MovieDetailContent";

vi.mock("../sessions/moodCues.api", () => ({
  getMoodCues: vi.fn(async () => [
    { id: "easygoing", label: "Easygoing", category: "energy", description: "", display_order: 1 },
  ]),
}));

const movie: MovieDetail = {
  reference: "watchlist-a",
  group_id: "group-a",
  group_name: "Match Club",
  title_id: "title-a",
  source: "tmdb",
  source_id: "1",
  media_type: "movie",
  title: "Get Out",
  release_year: 2017,
  release_date: "2017-02-24",
  runtime_minutes: 104,
  poster_path: null,
  backdrop_path: null,
  overview: "A weekend visit reveals something deeply wrong.",
  genres: ["Horror", "Mystery"],
  directors: ["Jordan Peele"],
  cast: [{ name: "Daniel Kaluuya", role: "Chris" }],
  certification: "R",
  trailer_url: null,
  watchlist: {
    item_id: "watchlist-a",
    status: "watchlist",
    added_at: "2026-07-20T20:00:00Z",
    added_by: {
      id: "user-a",
      username: "henry",
      display_name: "Henry",
      avatar_url: null,
      avatar_source: "initials",
      avatar_style: null,
      avatar_seed: null,
    },
  },
  session: {
    session_id: "session-a",
    status: "active",
    match_reason: null,
    mood_cue_ids: ["easygoing"],
  },
  history: {
    appearance_count: 1,
    win_count: 1,
    last_considered_at: "2026-07-20T20:00:00Z",
    last_watched_at: "2026-07-20T20:00:00Z",
    recent_movie_nights: [],
  },
};

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <HeroUIProvider>
        <QueryClientProvider client={queryClient}>
          <MovieDetailContent movie={movie} onClose={vi.fn()} />
        </QueryClientProvider>
      </HeroUIProvider>
    </MemoryRouter>,
  );
}

describe("MovieDetailContent", () => {
  it("renders resilient metadata, group context, and active-vote privacy", async () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "Get Out" })).toBeInTheDocument();
    expect(screen.getByText("2017 · Horror, Mystery · 1h 44m · R")).toBeInTheDocument();
    expect(screen.getByText(/Added .* by Henry\./)).toBeInTheDocument();
    expect(screen.getByText("Voting remains private while the session is active.")).toBeInTheDocument();
    expect(await screen.findByText("Easygoing")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /poster/i })).not.toBeInTheDocument();
  });
});
