import { describe, expect, it } from "vitest";
import type { CompletedSession } from "../sessions/sessions.api";
import { buildMovieNightCardSvg } from "./cardRenderer";

const night: CompletedSession = {
  session_id: "private-session-id",
  group_id: "private-group-id",
  group_name: "Match Club",
  status: "completed",
  created_at: "2026-07-20T20:00:00Z",
  started_at: "2026-07-20T20:01:00Z",
  winner_selected_at: "2026-07-20T20:08:00Z",
  completed_at: "2026-07-20T20:09:00Z",
  criteria: { mood_cues: ["easygoing"] },
  winner_candidate_id: "winner-id",
  decision_duration_seconds: 420,
  winner_unanimous: false,
  had_tie: false,
  tie_resolution: null,
  watched_status: "watched",
  watched_confirmed_at: null,
  teleparty_was_shared: true,
  teleparty_shared_at: "2026-07-20T20:10:00Z",
  teleparty_handoff_at: null,
  participants: [
    {
      id: "participant-id",
      user_id: "private-user-id",
      display_name: "Private Participant",
      avatar_url: null,
      avatar_source: "initials",
      avatar_style: null,
      avatar_seed: null,
      joined_at: null,
      submitted_votes: true,
      role: "host",
      participation_status: "participated",
      criteria: null,
    },
  ],
  candidates: [
    {
      id: "winner-id",
      source_watchlist_item_id: "watchlist-id",
      source_title_id: "title-id",
      source: "tmdb",
      source_id: "1",
      media_type: "movie",
      title: "A Beautiful Film",
      release_year: 2026,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: 104,
      genres: ["Drama"],
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

describe("movie night card rendering", () => {
  it("uses privacy-preserving defaults and deterministic high-resolution dimensions", () => {
    const svg = buildMovieNightCardSvg(
      { night, moodLabels: ["Easygoing"] },
      {
        format: "square",
        template: "editorial",
        includeGroupName: false,
        includeMood: true,
        includeAttribution: true,
      },
    );

    expect(svg).toContain('width="1080" height="1080"');
    expect(svg).toContain("A Beautiful Film");
    expect(svg).toContain("Easygoing");
    expect(svg).toContain("1 participant");
    expect(svg).not.toContain("Match Club");
    expect(svg).not.toContain("Private Participant");
    expect(svg).not.toContain("private-session-id");
    expect(svg).not.toContain("private-user-id");
    expect(svg).not.toContain("Teleparty");
    expect(svg).not.toContain("yes_count");
  });

  it("only includes the group name after explicit selection", () => {
    const svg = buildMovieNightCardSvg(
      { night, moodLabels: [] },
      {
        format: "portrait",
        template: "programme",
        includeGroupName: true,
        includeMood: false,
        includeAttribution: false,
      },
    );
    expect(svg).toContain('width="1080" height="1920"');
    expect(svg).toContain("Match Club");
    expect(svg).not.toContain(">Arbiter<");
  });

  it("embeds available poster artwork and provides a designed missing-art fallback", () => {
    const options = {
      format: "square" as const,
      template: "editorial" as const,
      includeGroupName: false,
      includeMood: false,
      includeAttribution: true,
    };
    const withArtwork = buildMovieNightCardSvg(
      { night, moodLabels: [], artworkDataUrl: "data:image/jpeg;base64,cG9zdGVy" },
      options,
    );
    expect(withArtwork).toContain("<image");
    expect(withArtwork).toContain("data:image/jpeg;base64,cG9zdGVy");
    expect(withArtwork).not.toContain("FEATURE PRESENTATION");

    const withoutArtwork = buildMovieNightCardSvg(
      { night, moodLabels: [], artworkDataUrl: null },
      options,
    );
    expect(withoutArtwork).not.toContain("<image");
    expect(withoutArtwork).toContain("FEATURE PRESENTATION");
  });
});
