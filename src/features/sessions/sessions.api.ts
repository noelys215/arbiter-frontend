import { api, apiJson, jsonBody } from "../../lib/api";
import type { AvatarSource } from "../avatar/avatarTypes";

export type SessionTitle = {
  id: string;
  source: string;
  source_id: string | null;
  media_type: "movie" | "tv" | string;
  name: string;
  release_year: number | null;
  poster_path: string | null;
  overview: string | null;
  runtime_minutes: number | null;
  tmdb_genres?: string[];
  tmdb_genre_ids?: number[];
  tmdb_streaming_options?: Array<{
    provider_name: string;
    streaming_url?: string | null;
  }>;
  tmdb_streaming_providers?: string[];
  tmdb_streaming_link?: string | null;
};

export type SessionCandidate = {
  watchlist_item_id: string;
  position: number;
  title: SessionTitle;
  ai_note?: string | null;
  reason?: string | null;
  why?: string | null;
};

export type CreateSessionPayload = {
  constraints: Record<string, unknown>;
  text?: string | null;
  confirm_ready?: boolean;
  duration_seconds?: number;
  candidate_count?: number;
};

export type CreateSessionResponse = {
  session_id: string;
  ends_at: string;
  constraints: {
    mood_cues: string[];
    moods: string[];
    avoid: string[];
    max_runtime: number | null;
    format: "movie" | "tv" | "any";
    energy: "low" | "med" | "high" | null;
    free_text: string;
    custom_mood_text: string;
    parsed_by_ai: boolean;
    ai_version: string | null;
  };
  ai_used: boolean;
  ai_why: string | null;
  phase?: "collecting" | "swiping" | "waiting" | "complete" | string;
  round?: number;
  user_locked?: boolean;
  user_seconds_left?: number;
  tie_break_required?: boolean;
  tie_break_candidate_ids?: string[];
  ended_by_leader?: boolean;
  candidates: SessionCandidate[];
  personal_candidates?: SessionCandidate[];
};

export type SessionStateResponse = {
  session_id: string;
  status:
    | "setup"
    | "active"
    | "winner_selected"
    | "completed"
    | "cancelled"
    | "complete"
    | string;
  phase?: "collecting" | "swiping" | "waiting" | "complete" | string;
  round?: number;
  user_locked?: boolean;
  user_seconds_left?: number;
  tie_break_required?: boolean;
  tie_break_candidate_ids?: string[];
  ended_by_leader?: boolean;
  ends_at: string;
  completed_at: string | null;
  result_watchlist_item_id: string | null;
  watch_party_url?: string | null;
  watch_party_set_at?: string | null;
  watch_party_set_by_user_id?: string | null;
  candidates: SessionCandidate[];
  mutual_candidate_ids?: string[];
  shortlist?:
    | string[]
    | Array<{
        watchlist_item_id?: string;
      }>;
  vote_summaries?: SessionVoteSummary[];
};

export type CompletedSessionParticipant = {
  id: string;
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
  joined_at: string | null;
  submitted_votes: boolean;
  role: "host" | "participant";
  participation_status: "participated" | "left";
  criteria: Record<string, unknown> | null;
};

export type CompletedSessionCandidate = {
  id: string;
  source_title_id?: string | null;
  source: string | null;
  source_id: string | null;
  media_type: string | null;
  title: string;
  release_year: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime_minutes: number | null;
  genres: string[];
  overview: string | null;
  position: number;
  yes_count: number | null;
  no_count: number | null;
  total_vote_count: number | null;
  is_winner: boolean;
  is_finalist: boolean;
};

export type CompletedSession = {
  session_id: string;
  group_id: string;
  group_name: string;
  status: "winner_selected" | "completed";
  created_at: string;
  started_at: string | null;
  winner_selected_at: string;
  completed_at: string | null;
  criteria: Record<string, unknown>;
  winner_candidate_id: string;
  decision_duration_seconds: number | null;
  winner_unanimous: boolean | null;
  had_tie: boolean | null;
  tie_resolution: string | null;
  watched_status: "unconfirmed" | "watched" | "not_watched";
  watched_confirmed_at: string | null;
  teleparty_was_shared: boolean;
  teleparty_shared_at: string | null;
  teleparty_handoff_at: string | null;
  participants: CompletedSessionParticipant[];
  candidates: CompletedSessionCandidate[];
};

export type CompletedSessionPage = {
  items: CompletedSession[];
  next_cursor: string | null;
};

export type SessionVote = "yes" | "no";

export type SessionVoteParticipant = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_source: AvatarSource | null;
  avatar_style: string | null;
  avatar_seed: string | null;
  vote: SessionVote;
};

export type SessionVoteSummary = {
  watchlist_item_id: string;
  yes_count: number;
  no_count: number;
  total_count: number;
  is_leading: boolean;
  voters: SessionVoteParticipant[];
};

export type SubmitVotePayload = {
  watchlist_item_id: string;
  vote: SessionVote;
};

export type SubmitVoteResponse = {
  ok: boolean;
};

export async function createSession(
  groupId: string,
  payload: CreateSessionPayload,
) {
  return apiJson<CreateSessionResponse>(`/groups/${groupId}/sessions`, {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function getSessionState(sessionId: string) {
  return apiJson<SessionStateResponse>(`/sessions/${sessionId}`);
}

export async function submitSessionVote(
  sessionId: string,
  payload: SubmitVotePayload,
) {
  return apiJson<SubmitVoteResponse>(`/sessions/${sessionId}/vote`, {
    method: "POST",
    ...jsonBody(payload),
  });
}

export async function undoSessionVote(sessionId: string, watchlistItemId: string) {
  return apiJson<SubmitVoteResponse>(
    `/sessions/${sessionId}/vote/${watchlistItemId}`,
    {
      method: "DELETE",
    },
  );
}

export async function shuffleSession(sessionId: string) {
  return apiJson<SessionStateResponse>(`/sessions/${sessionId}/shuffle`, {
    method: "POST",
  });
}

export async function endSession(sessionId: string) {
  return apiJson<SessionStateResponse>(`/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

export async function setSessionWatchPartyLink(
  sessionId: string,
  payload: { url: string | null },
) {
  return apiJson<SessionStateResponse>(`/sessions/${sessionId}/watch-party`, {
    method: "PATCH",
    ...jsonBody(payload),
  });
}

export async function completeSession(sessionId: string) {
  return apiJson<CompletedSession>(`/sessions/${sessionId}/completion`, {
    method: "POST",
  });
}

export async function getSessionCompletion(sessionId: string) {
  return apiJson<CompletedSession>(`/sessions/${sessionId}/completion`);
}

export async function updateSessionWatchedStatus(
  sessionId: string,
  status: "watched" | "not_watched" | "unconfirmed",
) {
  return apiJson<CompletedSession>(`/sessions/${sessionId}/completion/watched`, {
    method: "PATCH",
    ...jsonBody({ status }),
  });
}

export async function markSessionWatchPartyHandoff(sessionId: string) {
  const response = await api(`/sessions/${sessionId}/watch-party/handoff`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
}

export async function getGroupMovieNights(
  groupId: string,
  options: { limit?: number; cursor?: string | null } = {},
) {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.cursor) params.set("cursor", options.cursor);
  const query = params.size > 0 ? `?${params.toString()}` : "";
  return apiJson<CompletedSessionPage>(
    `/groups/${encodeURIComponent(groupId)}/movie-nights${query}`,
  );
}
