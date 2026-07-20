import type { Location } from "react-router-dom";
import { formatRuntime } from "../sessions/historyPresentation";
import type { MovieDetail } from "./movies.api";

export type MovieDetailLocationState = {
  backgroundLocation?: Location;
};

export function movieDetailPath(
  groupId: string,
  reference: string,
  sessionId?: string | null,
) {
  const base = `/app/groups/${encodeURIComponent(groupId)}/movies/${encodeURIComponent(reference)}`;
  return sessionId ? `${base}?sessionId=${encodeURIComponent(sessionId)}` : base;
}

export function formatMovieMetadata(movie: MovieDetail) {
  return [
    movie.release_year ? String(movie.release_year) : null,
    movie.genres.slice(0, 2).join(", ") || null,
    formatRuntime(movie.runtime_minutes),
    movie.certification,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatShortDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
