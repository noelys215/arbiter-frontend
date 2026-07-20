import { AvatarGroup, Button, Spinner } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ArbiterAvatar from "../../components/ArbiterAvatar";
import { getGroup } from "../../features/groups/groups.api";
import {
  formatMovieNightDate,
  getCriteria,
  getWinner,
} from "../../features/sessions/historyPresentation";
import { getMoodCues } from "../../features/sessions/moodCues.api";
import { sessionQueryKeys } from "../../features/sessions/sessionQueryKeys";
import { getGroupMovieNights } from "../../features/sessions/sessions.api";
import { tmdbPosterUrl } from "../../lib/tmdb";
import MovieNightsShell from "./MovieNightsShell";

export default function MovieNightsPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const groupQuery = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: () => getGroup(groupId),
    enabled: Boolean(groupId),
  });
  const cuesQuery = useQuery({
    queryKey: sessionQueryKeys.moodCues,
    queryFn: getMoodCues,
    staleTime: Infinity,
  });
  const historyQuery = useInfiniteQuery({
    queryKey: sessionQueryKeys.history(groupId),
    queryFn: ({ pageParam }) =>
      getGroupMovieNights(groupId, { limit: 12, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: Boolean(groupId),
  });
  const nights = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [historyQuery.data],
  );
  const cueLabels = useMemo(
    () => new Map((cuesQuery.data ?? []).map((cue) => [cue.id, cue.label])),
    [cuesQuery.data],
  );

  return (
    <MovieNightsShell>
      <div className="mx-auto w-full max-w-[82rem] px-4 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-col gap-6 border-b border-[#E0B15C]/12 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">
              {groupQuery.data?.name ?? "Your group"}
            </p>
            <h1 className="app-heading-serif mt-2 text-4xl leading-tight text-[#F7EAD2] sm:text-6xl">
              Movie Nights
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#E4D0AD]">
              The choices, moods, and people who made each night yours.
            </p>
          </div>
          <Button
            variant="light"
            className="app-secondary-button h-11 self-start px-4 sm:self-auto"
            onPress={() => navigate("/app")}
          >
            Back to watchlist
          </Button>
        </header>

        {historyQuery.isPending ? (
          <div className="flex min-h-72 items-center justify-center" role="status">
            <Spinner color="warning" label="Loading movie nights" />
          </div>
        ) : historyQuery.isError ? (
          <section className="max-w-xl py-20" role="alert">
            <h2 className="app-heading-serif text-3xl text-[#F7EAD2]">
              We couldn’t open the archive.
            </h2>
            <p className="mt-3 text-[#E4D0AD]">Please try again in a moment.</p>
            <Button
              className="app-secondary-button mt-6 h-11"
              onPress={() => historyQuery.refetch()}
            >
              Try again
            </Button>
          </section>
        ) : nights.length === 0 ? (
          <section className="max-w-2xl py-20 sm:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">
              The first night is still ahead
            </p>
            <h2 className="app-heading-serif mt-3 text-4xl leading-tight text-[#F7EAD2] sm:text-5xl">
              Your movie nights will collect here.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#E4D0AD]">
              Finish a session and Arbiter will preserve the choice, the mood,
              and everyone who helped decide.
            </p>
            <Button
              className="app-primary-button mt-8 h-11 px-5"
              onPress={() => navigate(`/app/session?groupId=${groupId}`)}
            >
              Start a movie night
            </Button>
          </section>
        ) : (
          <>
            <ol className="divide-y divide-[#E0B15C]/10" aria-label="Completed movie nights">
              {nights.map((night) => {
                const winner = getWinner(night);
                if (!winner) return null;
                const criteria = getCriteria(night);
                const moodLabels = (criteria.mood_cues ?? [])
                  .map((id) => cueLabels.get(id))
                  .filter((label): label is string => Boolean(label));
                const moodLine =
                  criteria.custom_mood_text?.trim() || moodLabels.join(" · ");
                const poster = tmdbPosterUrl(winner.poster_path, "w342");
                return (
                  <motion.li
                    key={night.session_id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  >
                    <Link
                      to={`/app/groups/${groupId}/movie-nights/${night.session_id}`}
                      className="group grid min-h-44 grid-cols-[76px_minmax(0,1fr)] gap-5 py-6 outline-none focus-visible:ring-3 focus-visible:ring-[#F2C16E] sm:grid-cols-[94px_minmax(0,1fr)_auto] sm:items-center sm:gap-7 sm:py-7"
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-sm bg-[#2A1813]">
                        {poster ? (
                          <img
                            src={poster}
                            alt={`${winner.title} poster`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[#CDB58E]">
                            {winner.title}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 self-center">
                        <time
                          dateTime={night.completed_at ?? night.winner_selected_at}
                          className="text-xs font-semibold uppercase tracking-[0.12em] text-[#CDB58E]"
                        >
                          {formatMovieNightDate(
                            night.completed_at ?? night.winner_selected_at,
                          )}
                        </time>
                        <h2 className="mt-2 text-xl font-semibold leading-tight text-[#F7EAD2] transition-colors group-hover:text-[#F2C16E] sm:text-2xl">
                          {winner.title}
                        </h2>
                        {moodLine ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#E4D0AD]">
                            {moodLine}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <AvatarGroup max={4} aria-label={`${night.participants.length} participants`}>
                            {night.participants.slice(0, 4).map((participant) => (
                              <ArbiterAvatar
                                key={participant.id}
                                user={participant}
                                size="sm"
                                decorative
                              />
                            ))}
                          </AvatarGroup>
                          <span className="text-sm text-[#CDB58E]">
                            {night.participants.length} {night.participants.length === 1 ? "participant" : "participants"}
                          </span>
                          {night.watched_status === "watched" ? (
                            <span className="text-sm font-semibold text-[#E4D0AD]">Watched</span>
                          ) : null}
                        </div>
                      </div>
                      <span
                        aria-hidden="true"
                        className="hidden text-2xl text-[#CDB58E] transition-transform group-hover:translate-x-1 sm:block"
                      >
                        →
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ol>
            {historyQuery.hasNextPage ? (
              <div className="flex justify-center border-t border-[#E0B15C]/10 pt-8">
                <Button
                  className="app-secondary-button h-11"
                  isLoading={historyQuery.isFetchingNextPage}
                  onPress={() => historyQuery.fetchNextPage()}
                >
                  Load more nights
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </MovieNightsShell>
  );
}
