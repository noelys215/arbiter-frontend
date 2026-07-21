import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { addTmdbToWatchlist } from "../watchlist/watchlist.api";
import { getMoodCues } from "../sessions/moodCues.api";
import { sessionQueryKeys } from "../sessions/sessionQueryKeys";
import { tmdbPosterUrl } from "../../lib/tmdb";
import { normalizeTrailerUrl } from "../../lib/externalLinks";
import {
  formatMovieMetadata,
  formatShortDate,
} from "./moviePresentation";
import type { MovieDetail } from "./movies.api";

type MovieDetailContentProps = {
  movie: MovieDetail;
  onClose: () => void;
  compact?: boolean;
};

function historicalSummary(movie: MovieDetail) {
  const { appearance_count: appearances, win_count: wins } = movie.history;
  if (appearances === 0) return "New to this group’s movie nights.";
  if (wins > 0) {
    return `${appearances === 1 ? "Appeared once" : `Appeared in ${appearances} movie nights`} and ${wins === 1 ? "won once" : `won ${wins} times`}.`;
  }
  return appearances === 1
    ? "Appeared in one previous movie night."
    : `Appeared in ${appearances} previous movie nights.`;
}

export default function MovieDetailContent({
  movie,
  onClose,
  compact = false,
}: MovieDetailContentProps) {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const poster = tmdbPosterUrl(movie.poster_path, "w500");
  const backdrop = tmdbPosterUrl(movie.backdrop_path, "original");
  const trailerUrl = normalizeTrailerUrl(movie.trailer_url);
  const metadata = formatMovieMetadata(movie);
  const cuesQuery = useQuery({
    queryKey: sessionQueryKeys.moodCues,
    queryFn: getMoodCues,
    staleTime: Infinity,
    enabled: Boolean(movie.session?.mood_cue_ids.length),
  });
  const cueLabels = useMemo(
    () => new Map((cuesQuery.data ?? []).map((cue) => [cue.id, cue.label])),
    [cuesQuery.data],
  );
  const matchedCues = (movie.session?.mood_cue_ids ?? [])
    .map((id) => cueLabels.get(id))
    .filter((label): label is string => Boolean(label));
  const addMutation = useMutation({
    mutationFn: () => {
      if (!movie.source_id || !["movie", "tv"].includes(movie.media_type)) {
        throw new Error("This title cannot be added automatically.");
      }
      return addTmdbToWatchlist(movie.group_id, {
        tmdb_id: Number(movie.source_id),
        media_type: movie.media_type as "movie" | "tv",
        title: movie.title,
        year: movie.release_year,
        poster_path: movie.poster_path,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["watchlist-library", movie.group_id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["movie-detail", movie.group_id, movie.reference],
      });
    },
  });

  return (
    <article className="movie-detail-surface bg-[#140C0A]">
      <header className={`relative overflow-hidden ${compact ? "min-h-[25rem]" : "min-h-[34rem]"}`}>
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <div className="absolute inset-0 bg-[#140C0A]/82" aria-hidden="true" />

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: "easeOut" }}
          className={`relative mx-auto grid h-full max-w-[78rem] gap-7 px-5 pb-10 pt-20 sm:px-9 ${compact ? "lg:grid-cols-[150px_minmax(0,1fr)] lg:items-end" : "lg:grid-cols-[210px_minmax(0,1fr)] lg:items-end lg:pt-28"}`}
        >
          <div className={`hidden overflow-hidden rounded-md border border-[#E0B15C]/18 bg-[#261510] shadow-2xl shadow-black/30 lg:block ${compact ? "aspect-[2/3]" : "aspect-[2/3]"}`}>
            {poster ? (
              <img src={poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-end p-5 text-sm text-[#CDB58E]">Artwork unavailable</div>
            )}
          </div>
          <div className="max-w-3xl self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7BE95]">
              {movie.media_type === "tv" ? "Series" : "Feature presentation"}
            </p>
            <h1 id="movie-detail-heading" className={`app-heading-serif mt-3 text-[#F7EAD2] ${compact ? "text-4xl sm:text-5xl" : "text-5xl sm:text-7xl"}`}>
              {movie.title}
            </h1>
            {metadata ? <p className="mt-4 text-base leading-7 text-[#EAD9BC]">{metadata}</p> : null}
            {movie.overview ? (
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#D8C5A5] sm:text-lg">
                {movie.overview}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {!movie.watchlist && movie.source === "tmdb" ? (
                <Button
                  className="app-primary-button h-11 px-5"
                  isPending={addMutation.isPending}
                  isDisabled={addMutation.isPending || !movie.source_id}
                  onPress={() => addMutation.mutate()}
                >
                  Add to watchlist
                </Button>
              ) : null}
              {movie.session ? (
                <Button className="app-secondary-button h-11" onPress={onClose}>
                  Return to session
                </Button>
              ) : (
                <Button className="app-secondary-button h-11" onPress={onClose}>
                  Back
                </Button>
              )}
              {trailerUrl ? (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-[#EAD9BC] transition-colors hover:text-[#F2C16E] focus-visible:outline-3 focus-visible:outline-[#F2C16E]"
                  aria-label={`Watch ${movie.title} trailer on YouTube, opens in a new tab`}
                >
                  Watch trailer ↗
                </a>
              ) : null}
            </div>
            {addMutation.isError ? (
              <p className="mt-3 text-sm text-[#F0A494]" role="alert">We couldn’t add this title. Please try again.</p>
            ) : null}
          </div>
        </motion.div>
      </header>

      <div className="mx-auto grid max-w-[78rem] gap-12 px-5 py-10 sm:px-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:py-14">
        <div className="space-y-12">
          {movie.session ? (
            <section aria-labelledby="tonight-fit-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Tonight’s context</p>
              <h2 id="tonight-fit-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">Why it fits the night</h2>
              <p className="mt-4 text-base leading-7 text-[#EAD9BC]">
                {movie.session.match_reason || "Chosen from the group’s watchlist for tonight’s shared deck."}
              </p>
              {matchedCues.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3" aria-label="Matching mood cues">
                  {matchedCues.map((cue) => (
                    <li key={cue} className="border-b border-[#E0B15C]/35 pb-1 text-sm font-semibold text-[#F2DDBA]">{cue}</li>
                  ))}
                </ul>
              ) : null}
              {movie.session.status === "active" ? (
                <p className="mt-5 text-sm text-[#CDB58E]">Voting remains private while the session is active.</p>
              ) : null}
            </section>
          ) : null}

          <section aria-labelledby="credits-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Programme notes</p>
            <h2 id="credits-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">Credits</h2>
            {movie.directors.length > 0 || movie.cast.length > 0 ? (
              <dl className="mt-6 grid gap-7 sm:grid-cols-2">
                {movie.directors.length > 0 ? (
                  <div><dt className="text-sm text-[#CDB58E]">Directed by</dt><dd className="mt-1 text-[#F0E1C8]">{movie.directors.join(", ")}</dd></div>
                ) : null}
                {movie.cast.length > 0 ? (
                  <div><dt className="text-sm text-[#CDB58E]">Featuring</dt><dd className="mt-1 space-y-1 text-[#F0E1C8]">{movie.cast.slice(0, 5).map((person) => <span key={`${person.name}-${person.role}`} className="block">{person.name}{person.role ? <span className="text-[#CDB58E]"> · {person.role}</span> : null}</span>)}</dd></div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-4 text-base text-[#CDB58E]">Additional credits are not available for this title.</p>
            )}
          </section>
        </div>

        <aside className="space-y-9 lg:border-l lg:border-[#E0B15C]/12 lg:pl-9">
          {movie.watchlist ? (
            <section aria-labelledby="watchlist-context-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">In {movie.group_name}</p>
              <h2 id="watchlist-context-heading" className="app-heading-serif mt-2 text-2xl text-[#F7EAD2]">Watchlist note</h2>
              <p className="mt-4 text-sm leading-6 text-[#EAD9BC]">
                Added {formatShortDate(movie.watchlist.added_at) ?? "on an earlier date"}
                {movie.watchlist.added_by ? ` by ${movie.watchlist.added_by.display_name}` : ""}.
              </p>
            </section>
          ) : null}

          <section className="border-t border-[#E0B15C]/12 pt-8" aria-labelledby="history-context-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Group history</p>
            <h2 id="history-context-heading" className="app-heading-serif mt-2 text-2xl text-[#F7EAD2]">Past screenings</h2>
            <p className="mt-4 text-sm leading-6 text-[#EAD9BC]">{historicalSummary(movie)}</p>
            {movie.history.recent_movie_nights.length > 0 ? (
              <ul className="mt-5 divide-y divide-[#E0B15C]/10">
                {movie.history.recent_movie_nights.map((night) => (
                  <li key={night.session_id}>
                    <Link
                      to={`/app/groups/${movie.group_id}/movie-nights/${night.session_id}`}
                      className="flex min-h-11 items-center justify-between gap-4 py-3 text-sm text-[#EAD9BC] hover:text-[#F2C16E]"
                    >
                      <span>{formatShortDate(night.completed_at)}</span>
                      <span className="text-[#CDB58E]">{night.won ? "Winner" : "Considered"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </aside>
      </div>
    </article>
  );
}

export function MovieDetailLoading() {
  return <div className="flex min-h-[28rem] items-center justify-center" role="status"><Spinner color="warning" /><span className="sr-only">Opening film details</span></div>;
}

export function MovieDetailFailure({ onClose }: { onClose: () => void }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24" role="alert">
      <h1 className="app-heading-serif text-4xl text-[#F7EAD2]">This film can’t be opened.</h1>
      <p className="mt-4 leading-7 text-[#EAD9BC]">The saved details may be incomplete, or this title may not belong to the current group.</p>
      <Button className="app-secondary-button mt-7 h-11" onPress={onClose}>Back</Button>
    </section>
  );
}
