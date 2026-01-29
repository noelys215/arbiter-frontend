export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w92";

export function tmdbPosterUrl(path?: string | null) {
  if (!path) return null;
  return `${TMDB_POSTER_BASE}${path}`;
}
