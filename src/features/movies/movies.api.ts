import { apiJson } from "../../lib/api";
import type { AvatarSource } from "../avatar/avatarTypes";

export type MoviePerson = {
  name: string;
  role: string | null;
};

export type MovieDetail = {
  reference: string;
  group_id: string;
  group_name: string;
  title_id: string | null;
  source: string | null;
  source_id: string | null;
  media_type: string;
  title: string;
  release_year: number | null;
  release_date: string | null;
  runtime_minutes: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  genres: string[];
  directors: string[];
  cast: MoviePerson[];
  certification: string | null;
  trailer_url: string | null;
  watchlist: {
    item_id: string;
    status: string;
    added_at: string;
    added_by: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      avatar_source: AvatarSource | null;
      avatar_style: string | null;
      avatar_seed: string | null;
    } | null;
  } | null;
  session: {
    session_id: string;
    status: string;
    match_reason: string | null;
    mood_cue_ids: string[];
  } | null;
  history: {
    appearance_count: number;
    win_count: number;
    last_considered_at: string | null;
    last_watched_at: string | null;
    recent_movie_nights: Array<{
      session_id: string;
      completed_at: string;
      won: boolean;
      watched_status: string;
    }>;
  };
};

export const movieQueryKeys = {
  detail: (groupId: string, reference: string, sessionId?: string | null) =>
    ["movie-detail", groupId, reference, sessionId ?? null] as const,
};

export async function getMovieDetail(
  groupId: string,
  reference: string,
  sessionId?: string | null,
) {
  const query = new URLSearchParams();
  if (sessionId) query.set("session_id", sessionId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiJson<MovieDetail>(
    `/groups/${encodeURIComponent(groupId)}/movie-details/${encodeURIComponent(reference)}${suffix}`,
  );
}
