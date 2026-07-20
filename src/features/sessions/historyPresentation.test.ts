import { describe, expect, it } from "vitest";
import {
  decisionSummary,
  formatCandidateMetadata,
  formatRuntime,
  getCriteria,
  getWinner,
} from "./historyPresentation";
import type { CompletedSession } from "./sessions.api";

const session = {
  session_id: "session-1",
  group_id: "group-1",
  group_name: "Match Club",
  status: "completed",
  created_at: "2026-07-20T20:00:00Z",
  started_at: "2026-07-20T20:00:00Z",
  winner_selected_at: "2026-07-20T20:08:00Z",
  completed_at: "2026-07-20T20:09:00Z",
  criteria: {
    mood_cues: ["date-night"],
    custom_mood_text: "Something romantic but not cheesy.",
  },
  winner_candidate_id: "winner",
  decision_duration_seconds: 480,
  winner_unanimous: true,
  had_tie: false,
  tie_resolution: null,
  watched_status: "unconfirmed",
  watched_confirmed_at: null,
  teleparty_was_shared: false,
  teleparty_shared_at: null,
  teleparty_handoff_at: null,
  participants: [],
  candidates: [
    {
      id: "winner",
      source_watchlist_item_id: "item-1",
      source: "tmdb",
      source_id: "1",
      media_type: "movie",
      title: "Get Out",
      release_year: 2017,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: 104,
      genres: ["Horror", "Mystery", "Thriller"],
      overview: null,
      position: 0,
      yes_count: 2,
      no_count: 0,
      total_vote_count: 2,
      is_winner: true,
      is_finalist: true,
    },
  ],
} satisfies CompletedSession;

describe("history presentation", () => {
  it("formats durable metadata without empty separators", () => {
    expect(formatRuntime(104)).toBe("1h 44m");
    expect(formatCandidateMetadata(session.candidates[0])).toBe(
      "2017 · Horror, Mystery · 1h 44m",
    );
  });

  it("resolves the winner and structured historical criteria", () => {
    expect(getWinner(session)?.title).toBe("Get Out");
    expect(getCriteria(session).mood_cues).toEqual(["date-night"]);
    expect(decisionSummary(session)).toBe("Chosen unanimously");
  });
});
