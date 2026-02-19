import { apiJson, jsonBody } from "../../lib/api";

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
    moods: string[];
    avoid: string[];
    max_runtime: number | null;
    format: "movie" | "tv" | "any";
    energy: "low" | "med" | "high" | null;
    free_text: string;
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
  status: "active" | "complete" | string;
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
};

export type SessionVote = "yes" | "no";

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
