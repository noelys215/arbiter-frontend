import type { WatchlistItem, WatchlistTitle } from "./watchlist.api";

export type WatchlistRowMetadata = {
  title: string;
  poster: string | null;
  editorialLine: string | null;
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || /^(?:n\/?a|null|undefined)$/i.test(trimmed)) return null;
  return trimmed;
}

function cleanYear(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatRuntime(minutes: unknown): string | null {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;

  if (hours <= 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function formatSeasonCount(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const count = Math.round(value);
  return `${count} ${count === 1 ? "season" : "seasons"}`;
}

function formatGenre(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function titleFromItem(item: WatchlistItem): WatchlistTitle | null {
  return item.title ?? item.title_info ?? null;
}

export function getWatchlistRowMetadata(
  item: WatchlistItem,
): WatchlistRowMetadata {
  const title = titleFromItem(item);
  const name =
    cleanText(title?.name) ??
    cleanText(item.title_text) ??
    (typeof item.title === "string" ? cleanText(item.title) : null) ??
    "Untitled";
  const year = cleanYear(title?.release_year ?? item.year);
  const genres = Array.isArray(title?.tmdb_genres)
    ? title.tmdb_genres.map(cleanText).filter((value): value is string => Boolean(value)).slice(0, 2)
        .map(formatGenre)
    : [];
  const mediaType = title?.media_type ?? null;
  const runtime = formatRuntime(title?.runtime_minutes);
  const seasons =
    mediaType === "tv" ? formatSeasonCount(title?.season_count) : null;

  const editorialParts = [
    year ? String(year) : null,
    genres.length > 0 ? genres.join(", ") : null,
    mediaType === "tv" ? seasons : runtime,
  ].filter((value): value is string => Boolean(value));

  return {
    title: name,
    poster: title?.poster_path ?? item.poster_path ?? null,
    editorialLine: editorialParts.length > 0 ? editorialParts.join(" · ") : null,
  };
}
