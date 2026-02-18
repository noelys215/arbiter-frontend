import type { SessionCandidate, SessionStateResponse } from "../../features/sessions/sessions.api";
import type { WatchlistItem } from "../../features/watchlist/watchlist.api";
import {
  CANONICAL_GENRE_LABELS,
  RUNTIME_VIBE_TAGS,
  TMDB_GENRE_LABEL_BY_ID,
  TMDB_GENRE_SORT_INDEX,
} from "./constants";
import type { SessionContext, SwipeVote } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

export function toTitleCaseTag(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join(" ");
}

export function toDisplayGenreLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return CANONICAL_GENRE_LABELS[normalized] ?? toTitleCaseTag(normalized);
}

export function mapDirectionToVote(
  direction: "left" | "right" | "up" | "down",
): SwipeVote {
  if (direction === "right") return "yes";
  if (direction === "up") return "maybe";
  return "no";
}

export function mapVoteToBackend(vote: SwipeVote): "yes" | "no" {
  return vote === "no" ? "no" : "yes";
}

export function extractBackendShortlistIds(
  state: SessionStateResponse | undefined,
) {
  const shortlist = state?.shortlist;
  if (!Array.isArray(shortlist)) return [];

  const ids = shortlist
    .map((entry) => {
      if (typeof entry === "string") return entry;
      return entry?.watchlist_item_id ?? null;
    })
    .filter((id): id is string => Boolean(id));

  return uniqueStrings(ids);
}

export function buildWhyLine(card: SessionCandidate, context: SessionContext) {
  const backendReason = card.reason ?? card.why ?? card.ai_note;
  if (backendReason && backendReason.trim().length > 0) {
    return backendReason.trim();
  }

  const tagLine = context.tags.slice(0, 2).join(" + ");
  if (tagLine) {
    return `Matches: ${tagLine}`;
  }

  if (context.moodSummary.trim()) {
    return `Mood match: ${context.moodSummary.trim().slice(0, 64)}`;
  }

  return "Matches your current vibe";
}

export function getReadableVote(vote: SwipeVote | undefined) {
  if (vote === "yes") return "YES";
  if (vote === "maybe") return "MAYBE";
  if (vote === "no") return "NO";
  return "";
}

export function deriveAvailableGenreTags(items: WatchlistItem[]) {
  const labels = new Set<string>();

  for (const item of items) {
    const title = item.title ?? item.title_info;
    if (!title) continue;
    const runtime = title.runtime_minutes;
    const mediaType = String(title.media_type ?? "").toLowerCase();
    if (mediaType === "tv" && typeof runtime === "number" && runtime > 0) {
      if (runtime <= 30) labels.add(RUNTIME_VIBE_TAGS[1]);
      if (runtime <= 15) labels.add(RUNTIME_VIBE_TAGS[0]);
    }

    const genreIds = Array.isArray(title.tmdb_genre_ids)
      ? title.tmdb_genre_ids
      : [];
    const genreNames = Array.isArray(title.tmdb_genres)
      ? title.tmdb_genres
      : [];

    if (genreIds.length > 0) {
      for (const rawId of genreIds) {
        if (typeof rawId !== "number" || !Number.isFinite(rawId)) continue;
        const label = TMDB_GENRE_LABEL_BY_ID[rawId];
        if (label) labels.add(label);
      }
      continue;
    }

    for (const rawGenre of genreNames) {
      if (typeof rawGenre !== "string") continue;
      const label = toDisplayGenreLabel(rawGenre);
      if (label) labels.add(label);
    }
  }

  return Array.from(labels).sort((a, b) => {
    const left = TMDB_GENRE_SORT_INDEX[a] ?? Number.MAX_SAFE_INTEGER;
    const right = TMDB_GENRE_SORT_INDEX[b] ?? Number.MAX_SAFE_INTEGER;
    if (left !== right) return left - right;
    return a.localeCompare(b);
  });
}
