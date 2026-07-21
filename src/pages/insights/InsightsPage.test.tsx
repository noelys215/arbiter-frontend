import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GroupInsights } from "../../features/insights/groupInsights.api";
import InsightsPage from "./InsightsPage";

const { getGroupInsights } = vi.hoisted(() => ({
  getGroupInsights: vi.fn(),
}));

vi.mock("../../features/insights/groupInsights.api", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../../features/insights/groupInsights.api")
  >();
  return { ...original, getGroupInsights };
});
vi.mock("../../components/ArbiterAvatar", () => ({
  default: ({ label }: { label?: string }) => <span>{label ?? "Avatar"}</span>,
}));
vi.mock("../movieNights/MovieNightsShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseInsights: GroupInsights = {
  group_id: "group-a",
  group_name: "Match Club",
  calculation_version: "group-insights-v1",
  period: {
    key: "all_time",
    label: "All time",
    starts_at: null,
    ends_at: "2026-07-20T20:00:00Z",
  },
  availability: {
    sample_size: 5,
    confidence_tier: "established",
    personality_available: true,
    member_highlights_available: false,
    reason_unavailable: null,
    next_tier_at: null,
  },
  activity: {
    completed_nights: 5,
    confirmed_watched_nights: 4,
    total_watch_minutes: 420,
    average_watched_runtime_minutes: 105,
    unique_winners: 5,
    unique_genres_explored: 3,
  },
  decision: {
    average_seconds: 480,
    median_seconds: 420,
    average_candidate_count: 8.4,
    unanimous_rate: 0.6,
    unanimous_sample_size: 5,
  },
  taste: {
    genres: [
      { key: "Thriller", label: "Thriller", count: 3, percentage: 75 },
      { key: "Mystery", label: "Mystery", count: 2, percentage: 50 },
    ],
    moods: [
      {
        key: "edge-of-our-seats",
        label: "Edge of our seats",
        count: 3,
        percentage: 60,
      },
    ],
    runtime_bands: [],
  },
  records: [
    {
      key: "fastest-decision",
      label: "Fastest decision",
      value: "4 min",
      detail: "Get Out",
      session_id: "night-a",
    },
  ],
  personality: {
    title: "Consensus cinephiles",
    description: "Your group moves with a measured confidence.",
    supporting_facts: [
      "Thrillers appeared in 3 confirmed watched nights.",
      "Your median decision takes 7 min.",
    ],
    dimensions: [
      {
        key: "pace",
        label: "Decision pace",
        value: 0.47,
        interpretation: "measured",
      },
    ],
    sample_size: 5,
    confidence_tier: "established",
  },
  member_highlights: [],
  data_quality: {
    watched_runtimes_known: 4,
    watched_runtimes_missing: 0,
    decisions_timed: 5,
    unanimity_known: 5,
    sessions_with_vote_snapshots: 5,
    notes: [],
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/app/groups/group-a/insights"]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/app/groups/:groupId/insights"
            element={<InsightsPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("InsightsPage", () => {
  beforeEach(() => getGroupInsights.mockReset());

  it("shows the no-history state with one relevant action", async () => {
    getGroupInsights.mockResolvedValue({
      ...baseInsights,
      availability: {
        ...baseInsights.availability,
        sample_size: 0,
        confidence_tier: "empty",
        personality_available: false,
      },
      activity: {
        ...baseInsights.activity,
        completed_nights: 0,
      },
      personality: null,
    });
    renderPage();
    expect(
      await screen.findByRole("heading", {
        name: "Your group’s personality starts with its first movie night.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start a movie night" }),
    ).toBeInTheDocument();
  });

  it("shows cautious early language before the personality threshold", async () => {
    getGroupInsights.mockResolvedValue({
      ...baseInsights,
      availability: {
        ...baseInsights.availability,
        sample_size: 2,
        confidence_tier: "basic",
        personality_available: false,
      },
      activity: { ...baseInsights.activity, completed_nights: 2 },
      personality: null,
      data_quality: {
        ...baseInsights.data_quality,
        notes: ["Complete 3 more nights to reveal an initial group personality."],
      },
    });
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "A picture is beginning to form." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Complete 3 more nights/)).toBeInTheDocument();
  });

  it("renders personality, textual chart labels, and linked records", async () => {
    getGroupInsights.mockResolvedValue(baseInsights);
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Consensus cinephiles" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Thriller: 3, 75 percent" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fastest decision.*4 min.*Get Out/ })).toHaveAttribute(
      "href",
      "/app/groups/group-a/movie-nights/night-a",
    );
    expect(screen.getByText("7h")).toBeInTheDocument();
  });

  it("changes date ranges through the semantic tab control", async () => {
    getGroupInsights.mockResolvedValue(baseInsights);
    renderPage();
    await screen.findByRole("heading", { name: "Consensus cinephiles" });
    fireEvent.click(screen.getByRole("button", { name: "This year" }));
    await waitFor(() =>
      expect(getGroupInsights).toHaveBeenLastCalledWith("group-a", "this_year"),
    );
    expect(screen.getByRole("button", { name: "This year" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

});
