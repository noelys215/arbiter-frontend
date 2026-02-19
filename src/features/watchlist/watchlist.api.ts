import { apiJson, jsonBody } from "../../lib/api";

export type TmdbSearchResult = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  year?: number | null;
  poster_path?: string | null;
  genre_ids?: number[];
};

export type WatchlistTitle = {
  id?: string;
  source?: string;
  source_id?: string;
  media_type?: "movie" | "tv" | string;
  name?: string;
  release_year?: number | null;
  runtime_minutes?: number | null;
  poster_path?: string | null;
  tmdb_genres?: string[];
  tmdb_genre_ids?: number[];
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

export type WatchlistSort = "recent" | "oldest";

export type WatchlistLibraryParams = {
  q?: string;
  media_type?: "movie" | "tv" | null;
  genre_id?: number | null;
  sort?: WatchlistSort;
  limit?: number;
  cursor?: string | null;
  status?: "watchlist" | "watched";
};

export type WatchlistPage = {
  items: WatchlistItem[];
  next_cursor: string | null;
  total_count: number;
};

export async function searchTmdb(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiJson<TmdbSearchResult[]>(`/tmdb/search?${params.toString()}`);
}

export async function getGroupWatchlist(groupId: string) {
  return getGroupWatchlistWithOptions(groupId);
}

export async function getGroupWatchlistWithOptions(
  groupId: string,
  options?: { status?: "watchlist" | "watched"; tonight?: boolean },
) {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set("status", options.status);
  }
  if (options?.tonight) {
    params.set("tonight", "true");
  }
  const query = params.toString();
  const path = query
    ? `/groups/${groupId}/watchlist?${query}`
    : `/groups/${groupId}/watchlist`;
  return apiJson<WatchlistItem[]>(path);
}

export async function getGroupWatchlistPage(
  groupId: string,
  params?: WatchlistLibraryParams,
) {
  const query = new URLSearchParams();
  query.set("paginate", "true");
  query.set("limit", String(params?.limit ?? 24));

  if (params?.q && params.q.trim().length > 0) query.set("q", params.q.trim());
  if (params?.media_type) query.set("media_type", params.media_type);
  if (typeof params?.genre_id === "number" && Number.isFinite(params.genre_id)) {
    query.set("genre_id", String(params.genre_id));
  }
  if (params?.sort) query.set("sort", params.sort);
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.status) query.set("status", params.status);

  return apiJson<WatchlistPage>(`/groups/${groupId}/watchlist?${query.toString()}`);
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
