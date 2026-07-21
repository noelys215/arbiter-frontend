import type { CompletedSession } from "../sessions/sessions.api";
import {
  formatDecisionDuration,
  formatMovieNightDate,
  getWinner,
} from "../sessions/historyPresentation";
import type { ArtworkAnalysis, ArtworkKind } from "./artworkAnalysis";

export type CardFormat = "square" | "portrait";
export type CardTemplate =
  | "cinematic-poster"
  | "editorial-programme"
  | "archive-card";
export type LegacyCardTemplate =
  | CardTemplate
  | "editorial-poster"
  | "minimal-programme"
  | "editorial"
  | "programme";

export type CardOptions = {
  format: CardFormat;
  template: CardTemplate;
  includeGroupName: boolean;
  includeMood: boolean;
  includeAttribution: boolean;
};

export type CardSourceData = {
  night: CompletedSession;
  moodLabels: string[];
  artworkDataUrl?: string | null;
  artworkKind?: ArtworkKind | null;
  artworkAnalysis?: ArtworkAnalysis | null;
};

export type SafeCardPayload = {
  title: string;
  date: string;
  dateIso: string | null;
  participantCount: number | null;
  moods: string[];
  groupName: string | null;
  decisionDuration: string | null;
  watchedStatus: "watched" | "not_watched" | "unconfirmed";
  includeAttribution: boolean;
  artworkDataUrl: string | null;
  artworkKind: ArtworkKind | null;
  artworkAnalysis: ArtworkAnalysis | null;
};

export const CARD_DIMENSIONS: Record<
  CardFormat,
  { width: number; height: number }
> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 },
};

export const CARD_TEMPLATES: Array<{
  value: CardTemplate;
  label: string;
  description: string;
}> = [
  {
    value: "cinematic-poster",
    label: "Cinematic Poster",
    description: "Artwork-led",
  },
  {
    value: "editorial-programme",
    label: "Editorial Programme",
    description: "Typography-led",
  },
  {
    value: "archive-card",
    label: "Archive Card",
    description: "Memory-led",
  },
];

export function normalizeCardTemplate(
  value: string | null | undefined,
): CardTemplate {
  if (value === "editorial-poster" || value === "editorial") {
    return "cinematic-poster";
  }
  if (value === "minimal-programme" || value === "programme") {
    return "editorial-programme";
  }
  if (value === "editorial-programme" || value === "archive-card") {
    return value;
  }
  return "cinematic-poster";
}

function cleanText(value: string | null | undefined, maxLength: number) {
  return Array.from(value ?? "")
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code < 32 || code === 127 ? " " : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isoDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function createSafeCardPayload(
  source: CardSourceData,
  options: CardOptions,
): SafeCardPayload {
  const winner = getWinner(source.night);
  if (!winner) throw new Error("The completed movie night has no winner.");
  const completedAt =
    source.night.completed_at ?? source.night.winner_selected_at;
  const participantCount = source.night.participants.length;

  return {
    title: cleanText(winner.title, 300) || "Untitled",
    date: formatMovieNightDate(completedAt),
    dateIso: isoDate(completedAt),
    participantCount: participantCount > 0 ? participantCount : null,
    moods: options.includeMood
      ? source.moodLabels
          .map((label) => cleanText(label, 60))
          .filter(Boolean)
          .slice(0, 2)
      : [],
    groupName: options.includeGroupName
      ? cleanText(source.night.group_name, 72) || null
      : null,
    decisionDuration: source.night.decision_duration_seconds
      ? formatDecisionDuration(source.night.decision_duration_seconds)
      : null,
    watchedStatus: source.night.watched_status,
    includeAttribution: options.includeAttribution,
    artworkDataUrl: source.artworkDataUrl?.startsWith("data:image/")
      ? source.artworkDataUrl
      : null,
    artworkKind: source.artworkDataUrl ? source.artworkKind ?? null : null,
    artworkAnalysis: source.artworkDataUrl
      ? source.artworkAnalysis ?? null
      : null,
  };
}

export function participantCopy(count: number | null) {
  if (!count) return null;
  return count === 1 ? "Chosen by one" : `Chosen by ${count}`;
}

export function contextLine(payload: SafeCardPayload) {
  return [participantCopy(payload.participantCount), ...payload.moods]
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
}

export function archiveFacts(payload: SafeCardPayload) {
  return [
    payload.participantCount
      ? `${payload.participantCount} ${payload.participantCount === 1 ? "participant" : "participants"}`
      : null,
    payload.decisionDuration ? `Decided in ${payload.decisionDuration}` : null,
    payload.watchedStatus === "watched"
      ? "Watched"
      : payload.watchedStatus === "not_watched"
        ? "Not watched"
        : null,
  ].filter((value): value is string => Boolean(value));
}

export function footerCopy(
  payload: SafeCardPayload,
  template: CardTemplate,
) {
  if (template === "archive-card" && payload.groupName) {
    return `From the ${payload.groupName} archive`;
  }
  if (template === "editorial-programme") return "Decided together";
  return payload.groupName
    ? `Tonight’s choice · ${payload.groupName}`
    : "Tonight’s choice";
}

export function cardFilename(payload: SafeCardPayload, format: CardFormat) {
  const slug = payload.title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return ["arbiter", slug || "movie-night", payload.dateIso, format]
    .filter(Boolean)
    .join("-")
    .concat(".png");
}

export function cardSummary(
  payload: SafeCardPayload,
  options: CardOptions,
) {
  const format = options.format === "square" ? "Square" : "Portrait";
  const template =
    CARD_TEMPLATES.find((item) => item.value === options.template)?.label ??
    "Movie Night Card";
  const details = [
    payload.participantCount
      ? `${payload.participantCount} ${payload.participantCount === 1 ? "participant" : "participants"}`
      : null,
    payload.moods.length ? `the moods ${payload.moods.join(" and ")}` : null,
    payload.groupName ? `the group ${payload.groupName}` : null,
    payload.includeAttribution ? "Arbiter attribution included" : null,
  ].filter(Boolean);
  return `${format} ${template} for ${payload.title}, dated ${payload.date}${
    details.length ? `, showing ${details.join(", ")}` : ""
  }.`;
}
