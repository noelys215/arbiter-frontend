const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbPosterSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "original";

export function tmdbPosterUrl(
  path?: string | null,
  size: TmdbPosterSize = "w92",
) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
