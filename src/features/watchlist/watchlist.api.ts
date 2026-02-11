import { apiJson, jsonBody } from "../../lib/api";

export type TmdbSearchResult = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  year?: number | null;
  poster_path?: string | null;
};

export type WatchlistTitle = {
  id?: string;
  source?: string;
  source_id?: string;
  media_type?: "movie" | "tv" | string;
  name?: string;
  release_year?: number | null;
  poster_path?: string | null;
};

export type WatchlistItem = {
  id: string | number;
  group_id?: string;
  status?: string | null;
  snoozed_until?: string | null;
  created_at?: string;
  added_by_user?: {
    id?: string;
    email?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
  } | null;
  title?: WatchlistTitle | null;
  title_info?: WatchlistTitle | null;
  already_exists?: boolean;
  // Fallback fields for older responses
  title_text?: string;
  year?: number | null;
  poster_path?: string | null;
};

export async function searchTmdb(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiJson<TmdbSearchResult[]>(`/tmdb/search?${params.toString()}`);
}

export async function getGroupWatchlist(groupId: string) {
  return apiJson<WatchlistItem[]>(`/groups/${groupId}/watchlist`);
}

export async function addTmdbToWatchlist(
  groupId: string,
  payload: TmdbSearchResult,
) {
  return apiJson<WatchlistItem>(`/groups/${groupId}/watchlist`, {
    method: "POST",
    ...jsonBody({
      type: "tmdb",
      tmdb_id: payload.tmdb_id,
      media_type: payload.media_type,
      title: payload.title,
      year: payload.year,
      poster_path: payload.poster_path,
    }),
  });
}

export async function addManualToWatchlist(
  groupId: string,
  payload: { title: string; year?: number | null },
) {
  return apiJson<WatchlistItem>(`/groups/${groupId}/watchlist`, {
    method: "POST",
    ...jsonBody({
      type: "manual",
      title: payload.title,
      year: payload.year,
    }),
  });
}

export async function updateWatchlistItem(
  itemId: string | number,
  payload: Record<string, unknown>,
) {
  return apiJson<{ ok: boolean; removed?: boolean }>(
    `/watchlist-items/${itemId}`,
    {
      method: "PATCH",
      ...jsonBody(payload),
    },
  );
}
