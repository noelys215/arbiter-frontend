import { Button, ButtonGroup, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ArbiterAvatar from "../../components/ArbiterAvatar";
import {
  getGroupInsights,
  groupInsightsQueryKey,
  type InsightsPeriodKey,
  type RankedInsight,
} from "../../features/insights/groupInsights.api";
import {
  formatCount,
  formatInsightDuration,
  formatWatchTime,
} from "../../features/insights/insightsPresentation";
import MovieNightsShell from "../movieNights/MovieNightsShell";

function RankedBars({
  items,
  emptyCopy,
}: {
  items: RankedInsight[];
  emptyCopy: string;
}) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm leading-6 text-[#CDB58E]">{emptyCopy}</p>;
  }
  const max = Math.max(...items.map((item) => item.percentage), 1);
  return (
    <ol className="mt-6 space-y-4">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="font-semibold text-[#EAD9BC]">{item.label}</span>
            <span className="text-[#CDB58E]">
              {item.count} · {Math.round(item.percentage)}%
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E0B15C]/10"
            role="meter"
            aria-label={`${item.label}: ${item.count}, ${Math.round(item.percentage)} percent`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(item.percentage)}
          >
            <div
              className="h-full rounded-full bg-[#D8A851]"
              style={{ width: `${Math.max(4, (item.percentage / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InsightsPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [period, setPeriod] = useState<InsightsPeriodKey>("all_time");
  const insightsQuery = useQuery({
    queryKey: groupInsightsQueryKey(groupId, period),
    queryFn: () => getGroupInsights(groupId, period),
    enabled: Boolean(groupId),
    retry: false,
    throwOnError: false,
  });
  const insights = insightsQuery.data;
  const figures = useMemo(() => {
    if (!insights) return [];
    return [
      {
        value: String(insights.activity.completed_nights),
        label: insights.activity.completed_nights === 1 ? "movie night" : "movie nights",
      },
      {
        value: formatWatchTime(insights.activity.total_watch_minutes),
        label: "confirmed watch time",
      },
      {
        value: formatInsightDuration(insights.decision.average_seconds) ?? "—",
        label: "average decision",
      },
      {
        value: String(insights.activity.unique_genres_explored),
        label: insights.activity.unique_genres_explored === 1 ? "genre explored" : "genres explored",
      },
    ];
  }, [insights]);

  return (
    <MovieNightsShell>
      <div className="mx-auto w-full max-w-[82rem] px-4 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-col gap-7 border-b border-[#E0B15C]/12 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">
              {insights?.group_name ?? "Your group"}
            </p>
            <h1 className="app-heading-serif mt-2 text-4xl leading-tight text-[#F7EAD2] sm:text-6xl">
              Insights
            </h1>
            <p className="mt-3 text-base leading-7 text-[#E4D0AD]">
              The pace, taste, and rituals taking shape across your movie nights.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <nav aria-label="Group archive" className="flex min-h-11 items-center gap-5 text-sm font-semibold">
              <Link
                to={`/app/groups/${groupId}/movie-nights`}
                className="inline-flex min-h-11 items-center border-b border-transparent text-[#CDB58E] outline-none hover:text-[#F7EAD2] focus-visible:ring-3 focus-visible:ring-[#F2C16E]"
              >
                Movie Nights
              </Link>
              <span className="inline-flex min-h-11 items-center border-b border-[#E0B15C] text-[#F7EAD2]" aria-current="page">
                Insights
              </span>
            </nav>
            <Button className="app-secondary-button h-11" onPress={() => navigate("/app")}>
              Back to watchlist
            </Button>
          </div>
        </header>

        <fieldset className="mt-7">
          <legend className="sr-only">Insights date range</legend>
          <ButtonGroup className="gap-1 rounded-md border border-[#E0B15C]/18 bg-[#1C110F]/45 p-1">
            {([
              ["all_time", "All time"],
              ["this_year", "This year"],
            ] as const).map(([key, label]) => {
              const isSelected = period === key;
              return (
                <Button
                  key={key}
                  variant="light"
                  aria-pressed={isSelected}
                  className={`h-11 min-w-0 rounded-sm px-4 text-sm font-semibold ${
                    isSelected
                      ? "border-b-2 border-[#E0B15C] bg-[#E0B15C]/14 text-[#F7EAD2]"
                      : "border-b-2 border-transparent text-[#D8C5A4]"
                  }`}
                  onPress={() => setPeriod(key)}
                >
                  {label}
                </Button>
              );
            })}
          </ButtonGroup>
        </fieldset>

        {insightsQuery.isPending ? (
          <div className="flex min-h-[28rem] items-center justify-center" role="status">
            <Spinner color="warning" label="Reading your movie nights" />
          </div>
        ) : insightsQuery.isError || !insights ? (
          <section className="max-w-xl py-20" role="alert">
            <h2 className="app-heading-serif text-3xl text-[#F7EAD2]">We couldn’t open your insights.</h2>
            <p className="mt-3 text-[#E4D0AD]">Please try again in a moment.</p>
            <Button className="app-secondary-button mt-6 h-11" onPress={() => insightsQuery.refetch()}>
              Try again
            </Button>
          </section>
        ) : insights.activity.completed_nights === 0 ? (
          <section className="max-w-2xl py-20 sm:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">The story starts with one choice</p>
            <h2 className="app-heading-serif mt-3 text-4xl leading-tight text-[#F7EAD2] sm:text-5xl">
              Your group’s personality starts with its first movie night.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#E4D0AD]">
              Finish a session and Arbiter will begin noticing the rhythms you create together.
            </p>
            <Button className="app-primary-button mt-8 h-11 px-5" onPress={() => navigate(`/app/session?groupId=${groupId}`)}>
              Start a movie night
            </Button>
          </section>
        ) : (
          <motion.div
            key={period}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
          >
            <section className="border-b border-[#E0B15C]/10 py-12 sm:py-16" aria-labelledby="personality-heading">
              {insights.personality ? (
                <div className="grid gap-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Your group character</p>
                    <h2 id="personality-heading" className="app-heading-serif mt-3 max-w-4xl text-4xl leading-tight text-[#F7EAD2] sm:text-6xl">
                      {insights.personality.title}
                    </h2>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-[#E4D0AD]">{insights.personality.description}</p>
                  </div>
                  <ul className="space-y-3 border-l border-[#E0B15C]/18 pl-6 text-sm leading-6 text-[#D8C5A4]" aria-label="Facts supporting this group personality">
                    {insights.personality.supporting_facts.map((fact) => <li key={fact}>{fact}</li>)}
                  </ul>
                </div>
              ) : (
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">An early pattern</p>
                  <h2 id="personality-heading" className="app-heading-serif mt-3 text-4xl text-[#F7EAD2] sm:text-5xl">A picture is beginning to form.</h2>
                  <p className="mt-4 text-base leading-7 text-[#E4D0AD]">
                    {insights.data_quality.notes.find((note) => note.startsWith("Complete")) ?? "A few more nights will make the pattern clearer."}
                  </p>
                </div>
              )}
            </section>

            <section className="grid grid-cols-2 border-b border-[#E0B15C]/10 py-8 sm:grid-cols-4" aria-label="Key group figures">
              {figures.map((figure, index) => (
                <div key={figure.label} className={`min-w-0 px-3 py-4 first:pl-0 sm:px-6 ${index > 0 ? "border-l border-[#E0B15C]/10" : ""}`}>
                  <p className="app-heading-serif text-3xl text-[#F7EAD2] sm:text-4xl">{figure.value}</p>
                  <p className="mt-2 text-sm leading-5 text-[#CDB58E]">{figure.label}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-14 py-12 sm:py-16 lg:grid-cols-2 lg:gap-20">
              <section aria-labelledby="taste-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Taste profile</p>
                <h2 id="taste-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">What reaches the screen</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[#D8C5A4]">Genres count confirmed watched winners only.</p>
                <RankedBars items={insights.taste.genres} emptyCopy="Confirm a watched movie night to begin a reliable taste profile." />
              </section>
              <section aria-labelledby="mood-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Tonight feels like</p>
                <h2 id="mood-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">The moods you return to</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[#D8C5A4]">Selected cues across completed decisions.</p>
                <RankedBars items={insights.taste.moods} emptyCopy="Mood cues from future nights will collect here." />
              </section>
            </div>

            <section className="border-y border-[#E0B15C]/10 py-12" aria-labelledby="decision-heading">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Decision character</p>
                  <h2 id="decision-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">How the room decides</h2>
                </div>
                <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
                  <div><dt className="text-sm text-[#CDB58E]">Median decision</dt><dd className="mt-2 text-xl font-semibold text-[#F7EAD2]">{formatInsightDuration(insights.decision.median_seconds) ?? "Not enough timing data"}</dd></div>
                  <div><dt className="text-sm text-[#CDB58E]">Films considered</dt><dd className="mt-2 text-xl font-semibold text-[#F7EAD2]">{insights.decision.average_candidate_count === null ? "Not available" : `${insights.decision.average_candidate_count} on average`}</dd></div>
                  <div><dt className="text-sm text-[#CDB58E]">Unanimous nights</dt><dd className="mt-2 text-xl font-semibold text-[#F7EAD2]">{insights.decision.unanimous_rate === null ? "Not enough vote data" : `${Math.round(insights.decision.unanimous_rate * 100)}%`}</dd></div>
                </dl>
              </div>
            </section>

            {insights.records.length > 0 ? (
              <section className="py-12 sm:py-16" aria-labelledby="records-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Memorable records</p>
                <h2 id="records-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">Nights worth remembering</h2>
                <ul className="mt-7 divide-y divide-[#E0B15C]/10">
                  {insights.records.map((record) => (
                    <li key={record.key}>
                      {record.session_id ? (
                        <Link to={`/app/groups/${groupId}/movie-nights/${record.session_id}`} className="group grid min-h-20 gap-2 py-5 outline-none focus-visible:ring-3 focus-visible:ring-[#F2C16E] sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-8">
                          <span className="text-sm text-[#CDB58E]">{record.label}</span><span className="text-xl font-semibold text-[#F7EAD2] group-hover:text-[#F2C16E]">{record.value}</span><span className="text-sm text-[#D8C5A4]">{record.detail}</span>
                        </Link>
                      ) : (
                        <div className="grid gap-2 py-5 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-8"><span className="text-sm text-[#CDB58E]">{record.label}</span><span className="text-xl font-semibold text-[#F7EAD2]">{record.value}</span><span className="text-sm text-[#D8C5A4]">{record.detail}</span></div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {insights.member_highlights.length > 0 ? (
              <section className="border-t border-[#E0B15C]/10 py-12" aria-labelledby="members-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CDB58E]">Member highlights</p>
                <h2 id="members-heading" className="app-heading-serif mt-2 text-3xl text-[#F7EAD2]">The people in the room</h2>
                <ul className="mt-7 grid gap-7 sm:grid-cols-2">
                  {insights.member_highlights.map((highlight) => (
                    <li key={`${highlight.user_id}-${highlight.title}`} className="flex items-center gap-4 border-t border-[#E0B15C]/12 pt-5">
                      <ArbiterAvatar user={highlight} size="lg" label={highlight.display_name} />
                      <div><p className="font-semibold text-[#F7EAD2]">{highlight.display_name} · {highlight.title}</p><p className="mt-1 text-sm text-[#CDB58E]">{highlight.explanation}</p></div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <footer className="border-t border-[#E0B15C]/10 py-8 text-sm leading-6 text-[#BFA986]">
              <p>{formatCount(insights.activity.confirmed_watched_nights, "confirmed watched night")} informs watch-time and genre figures. Completed but unconfirmed choices remain part of decision patterns.</p>
              {insights.data_quality.notes.filter((note) => !note.startsWith("Complete")).map((note) => <p className="mt-2" key={note}>{note}</p>)}
            </footer>
          </motion.div>
        )}
      </div>
    </MovieNightsShell>
  );
}
