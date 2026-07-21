import { Button, Spinner, useOverlayState } from "@heroui/react";
import AppAvatarGroup from "../../components/ui/AppAvatarGroup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ArbiterAvatar from "../../components/ArbiterAvatar";
import { getMe } from "../../features/auth/auth.api";
import { getGroup } from "../../features/groups/groups.api";
import {
  decisionSummary,
  formatCandidateMetadata,
  formatDecisionDuration,
  formatMovieNightDate,
  getCriteria,
  getFinalists,
  getOtherCandidates,
  getWinner,
} from "../../features/sessions/historyPresentation";
import { getMoodCues } from "../../features/sessions/moodCues.api";
import { sessionQueryKeys } from "../../features/sessions/sessionQueryKeys";
import {
  getSessionCompletion,
  updateSessionWatchedStatus,
} from "../../features/sessions/sessions.api";
import { tmdbPosterUrl } from "../../lib/tmdb";
import MovieNightsShell from "./MovieNightsShell";
import { movieDetailPath } from "../../features/movies/moviePresentation";

const MovieNightCardDialog = lazy(
  () => import("../../features/movie-night-cards/MovieNightCardDialog"),
);

const watchedOptions = [
  { value: "watched", label: "Watched" },
  { value: "not_watched", label: "Not watched" },
  { value: "unconfirmed", label: "Not confirmed" },
] as const;

export default function MovieNightDetailPage() {
  const { groupId = "", sessionId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cardDialog = useOverlayState();
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const groupQuery = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: () => getGroup(groupId),
    enabled: Boolean(groupId),
  });
  const completionQuery = useQuery({
    queryKey: sessionQueryKeys.completion(sessionId),
    queryFn: () => getSessionCompletion(sessionId),
    enabled: Boolean(sessionId),
  });
  const cuesQuery = useQuery({
    queryKey: sessionQueryKeys.moodCues,
    queryFn: getMoodCues,
    staleTime: Infinity,
  });
  const watchedMutation = useMutation({
    mutationFn: (status: "watched" | "not_watched" | "unconfirmed") =>
      updateSessionWatchedStatus(sessionId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        sessionQueryKeys.completion(sessionId),
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.history(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["group-insights", groupId],
      });
    },
  });

  const night = completionQuery.data;
  const winner = night ? getWinner(night) : undefined;
  const finalists = useMemo(() => (night ? getFinalists(night) : []), [night]);
  const others = useMemo(
    () => (night ? getOtherCandidates(night) : []),
    [night],
  );
  const cueLabels = useMemo(
    () => new Map((cuesQuery.data ?? []).map((cue) => [cue.id, cue.label])),
    [cuesQuery.data],
  );
  const criteria = night ? getCriteria(night) : {};
  const selectedCueLabels = (criteria.mood_cues ?? [])
    .map((id) => cueLabels.get(id))
    .filter((label): label is string => Boolean(label));
  const hostId = night?.participants.find(
    (participant) => participant.role === "host",
  )?.user_id;
  const canConfirmWatched = Boolean(
    me?.id && (me.id === hostId || me.id === groupQuery.data?.owner_id),
  );

  if (completionQuery.isPending) {
    return (
      <MovieNightsShell>
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
          <Spinner color="warning" />
          <span className="sr-only">Opening movie night</span>
        </div>
      </MovieNightsShell>
    );
  }

  if (completionQuery.isError || !night || !winner) {
    return (
      <MovieNightsShell>
        <section className="mx-auto max-w-2xl px-4 py-24 sm:px-8" role="alert">
          <h1 className="app-heading-serif text-4xl text-[#F7EAD2]">
            This movie night isn’t available.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#E4D0AD]">
            It may belong to another group, or the record may no longer be available.
          </p>
          <Button className="app-secondary-button mt-8 h-11" onPress={() => navigate("/app")}>
            Back to Arbiter
          </Button>
        </section>
      </MovieNightsShell>
    );
  }

  const backdrop = tmdbPosterUrl(winner.backdrop_path, "original");
  const poster = tmdbPosterUrl(winner.poster_path, "w500");
  const duration = formatDecisionDuration(night.decision_duration_seconds);

  return (
    <MovieNightsShell>
      <article>
        <header className="relative overflow-hidden border-b border-[#E0B15C]/12">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
          ) : null}
          <div className="absolute inset-0 bg-[#140C0A]/72" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[82rem] gap-8 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end">
            <div className="hidden aspect-[2/3] overflow-hidden rounded-sm bg-[#2A1813] shadow-2xl shadow-black/30 lg:block">
              {poster ? (
                <img src={poster} alt={`${winner.title} poster`} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="max-w-3xl">
              <Button
                variant="tertiary"
                className="mb-7 h-11 min-w-0 !bg-transparent px-0 text-sm text-[#E4D0AD] data-[hovered=true]:!bg-transparent data-[hovered=true]:text-[#F2C16E]"
                onPress={() => navigate(`/app/groups/${groupId}/movie-nights`)}
              >
                ← All movie nights
              </Button>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">
                {night.group_name} · {formatMovieNightDate(night.completed_at ?? night.winner_selected_at)}
              </p>
              <h1 className="app-heading-serif mt-3 text-5xl leading-[1.02] text-[#F7EAD2] sm:text-7xl">
                {winner.title}
              </h1>
              {formatCandidateMetadata(winner) ? (
                <p className="mt-4 text-base text-[#E4D0AD]">
                  {formatCandidateMetadata(winner)}
                </p>
              ) : null}
              <p className="mt-5 text-lg font-semibold text-[#F2C16E]">
                {decisionSummary(night)}
                {duration ? ` · Decided in ${duration}` : ""}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={movieDetailPath(
                    groupId,
                    winner.source_title_id
                      ? `title-${winner.source_title_id}`
                      : `history-${winner.id}`,
                  )}
                  state={{ backgroundLocation: location }}
                  className="inline-flex min-h-11 items-center rounded-md border border-[#E0B15C]/35 px-4 text-sm font-semibold text-[#EAD9BC] transition-colors hover:border-[#E0B15C]/60 hover:text-[#F2C16E]"
                >
                  View film details
                </Link>
                <Button className="app-primary-button h-11 px-5" onPress={cardDialog.open}>
                  Create card
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[82rem] gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-16 lg:py-16">
          <div className="space-y-14">
            <section aria-labelledby="night-context-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Tonight felt like</p>
              <h2 id="night-context-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">The mood of the night</h2>
              {selectedCueLabels.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3" aria-label="Selected mood cues">
                  {selectedCueLabels.map((label) => (
                    <li key={label} className="border-b border-[#E0B15C]/28 pb-1 text-base font-semibold text-[#EAD9BC]">{label}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-[#CDB58E]">No emotional cues were saved for this night.</p>
              )}
              {criteria.custom_mood_text ? (
                <blockquote className="app-heading-serif mt-7 border-l-2 border-[#E0B15C]/45 pl-5 text-2xl leading-relaxed text-[#F7EAD2]">
                  “{criteria.custom_mood_text}”
                </blockquote>
              ) : null}
              <dl className="mt-7 grid gap-4 text-sm sm:grid-cols-2">
                {criteria.moods && criteria.moods.length > 0 ? (
                  <div><dt className="text-[#CDB58E]">Genre preferences</dt><dd className="mt-1 text-[#EAD9BC]">{criteria.moods.join(", ")}</dd></div>
                ) : null}
                {criteria.max_runtime ? (
                  <div><dt className="text-[#CDB58E]">Runtime</dt><dd className="mt-1 text-[#EAD9BC]">Up to {criteria.max_runtime} minutes</dd></div>
                ) : null}
              </dl>
            </section>

            {finalists.length > 0 ? (
              <section aria-labelledby="finalists-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Close contenders</p>
                <h2 id="finalists-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">The finalists</h2>
                <ul className="mt-5 divide-y divide-[#E0B15C]/10">
                  {finalists.map((candidate) => (
                    <li key={candidate.id} className="flex items-center gap-4 py-4">
                      <div className="h-16 w-11 shrink-0 overflow-hidden rounded-sm bg-[#2A1813]">
                        {tmdbPosterUrl(candidate.poster_path, "w154") ? <img src={tmdbPosterUrl(candidate.poster_path, "w154") ?? ""} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0"><h3 className="font-semibold text-[#F7EAD2]">{candidate.title}</h3><p className="mt-1 text-sm text-[#CDB58E]">{formatCandidateMetadata(candidate)}</p></div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {others.length > 0 ? (
              <details className="border-t border-[#E0B15C]/12 pt-5">
                <summary className="cursor-pointer text-sm font-semibold text-[#EAD9BC] outline-none focus-visible:ring-3 focus-visible:ring-[#F2C16E]">
                  Other films considered ({others.length})
                </summary>
                <ul className="mt-4 columns-1 gap-8 sm:columns-2">
                  {others.map((candidate) => <li key={candidate.id} className="break-inside-avoid py-2 text-sm text-[#CDB58E]">{candidate.title}</li>)}
                </ul>
              </details>
            ) : null}
          </div>

          <aside className="space-y-10 lg:border-l lg:border-[#E0B15C]/12 lg:pl-10">
            <section aria-labelledby="participants-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">The group</p>
              <h2 id="participants-heading" className="app-heading-serif mt-2 text-2xl text-[#F7EAD2]">Who decided</h2>
              <AppAvatarGroup className="mt-5" max={6} aria-label={`${night.participants.length} historical participants`}>
                {night.participants.map((participant) => (
                  <ArbiterAvatar key={participant.id} user={participant} size="lg" label={participant.display_name} />
                ))}
              </AppAvatarGroup>
              <ul className="mt-5 space-y-2">
                {night.participants.map((participant) => (
                  <li key={participant.id} className="flex justify-between gap-4 text-sm"><span className="text-[#EAD9BC]">{participant.display_name}</span><span className="text-[#CDB58E]">{participant.role === "host" ? "Host" : "Participant"}</span></li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="watched-heading" className="border-t border-[#E0B15C]/12 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">After the vote</p>
              <h2 id="watched-heading" className="app-heading-serif mt-2 text-2xl text-[#F7EAD2]">Did you watch it?</h2>
              {canConfirmWatched ? (
                <div className="mt-5 flex flex-col gap-2" role="group" aria-label="Watched status">
                  {watchedOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="tertiary"
                      className={`h-11 justify-start border px-4 ${night.watched_status === option.value ? "border-[#E0B15C]/55 bg-[#E0B15C]/12 text-[#F7EAD2]" : "border-[#E0B15C]/12 text-[#E4D0AD]"}`}
                      aria-pressed={night.watched_status === option.value}
                      isPending={watchedMutation.isPending && watchedMutation.variables === option.value}
                      onPress={() => watchedMutation.mutate(option.value)}
                    >
                      <span aria-hidden="true" className="w-4">{night.watched_status === option.value ? "✓" : ""}</span>{option.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#E4D0AD]">
                  {watchedOptions.find((option) => option.value === night.watched_status)?.label ?? "Not confirmed"}
                </p>
              )}
              {watchedMutation.isError ? <p className="mt-3 text-sm text-[#E9A69A]" role="alert">We couldn’t update the watched status. Please try again.</p> : null}
            </section>

            {night.teleparty_was_shared ? (
              <section className="border-t border-[#E0B15C]/12 pt-8">
                <p className="text-sm font-semibold text-[#EAD9BC]">{night.teleparty_handoff_at ? "Watch party launched" : "Teleparty link shared"}</p>
                <p className="mt-2 text-sm leading-6 text-[#CDB58E]">The private party link is not kept in this record.</p>
              </section>
            ) : null}
          </aside>
        </div>
      </article>
      <Suspense fallback={null}>
        {cardDialog.isOpen ? (
          <MovieNightCardDialog
            isOpen={cardDialog.isOpen}
            onOpenChange={cardDialog.setOpen}
            night={night}
          />
        ) : null}
      </Suspense>
    </MovieNightsShell>
  );
}
