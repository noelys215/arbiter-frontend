import type {
  CompletedSession,
  CompletedSessionCandidate,
} from "./sessions.api";

export type HistoricalCriteria = {
  mood_cues?: string[];
  moods?: string[];
  max_runtime?: number | null;
  format?: "movie" | "tv" | "any";
  custom_mood_text?: string;
};

export function getWinner(session: CompletedSession) {
  return (
    session.candidates.find(
      (candidate) => candidate.id === session.winner_candidate_id,
    ) ?? session.candidates.find((candidate) => candidate.is_winner)
  );
}

export function getFinalists(session: CompletedSession) {
  return session.candidates.filter(
    (candidate) => candidate.is_finalist && !candidate.is_winner,
  );
}

export function getOtherCandidates(session: CompletedSession) {
  return session.candidates.filter(
    (candidate) => !candidate.is_finalist && !candidate.is_winner,
  );
}

export function getCriteria(session: CompletedSession): HistoricalCriteria {
  return session.criteria as HistoricalCriteria;
}

export function formatMovieNightDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDecisionDuration(seconds: number | null) {
  if (seconds === null || seconds < 60) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function formatRuntime(minutes: number | null) {
  if (!minutes || minutes < 1) return null;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatCandidateMetadata(candidate: CompletedSessionCandidate) {
  return [
    candidate.release_year ? String(candidate.release_year) : null,
    candidate.genres.slice(0, 2).join(", ") || null,
    formatRuntime(candidate.runtime_minutes),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function decisionSummary(session: CompletedSession) {
  if (session.winner_unanimous) return "Chosen unanimously";
  const winner = getWinner(session);
  const finalists = getFinalists(session);
  if (winner?.yes_count != null && finalists.length > 0) {
    const nearest = Math.max(
      ...finalists.map((candidate) => candidate.yes_count ?? 0),
    );
    const margin = winner.yes_count - nearest;
    if (margin === 1) return "Won by one vote";
  }
  if (session.had_tie) return "Chosen after a tie";
  return `Selected from ${session.candidates.length} ${session.candidates.length === 1 ? "film" : "films"}`;
}
