import { tmdbPosterUrl } from "../../../lib/tmdb";
import type { SessionCandidate } from "../../../features/sessions/sessions.api";

type SessionDeckCardProps = {
  card: SessionCandidate;
  index: number;
  isTopCard: boolean;
  isVisibleCard: boolean;
  isWinner: boolean;
  whyLine: string;
  voteLabel: string;
};

export default function SessionDeckCard({
  card,
  index,
  isTopCard,
  isVisibleCard,
  isWinner,
  whyLine,
  voteLabel,
}: SessionDeckCardProps) {
  const poster = tmdbPosterUrl(card.title.poster_path, "w780");
  const mediaType = (card.title.media_type ?? "title").toString().toUpperCase();
  const traceId = card.watchlist_item_id.slice(0, 8).toUpperCase();

  return (
    <article
      className={`session-deck-card-size session-card-base absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col justify-end rounded-2xl ${
        isTopCard ? "" : "pointer-events-none"
      } ${isVisibleCard ? "" : "opacity-0"} ${isWinner ? "session-winner" : ""}`}
      style={{ zIndex: index + 2 }}
    >
      {poster ? (
        <img
          src={poster}
          alt={card.title.name}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0C0C0C]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      <div className="session-micro-top-left">
        <p className="session-micro-code">[{traceId}]</p>
        <p className="session-micro-kicker">{mediaType} / SD 1.2</p>
        <div className="session-micro-rule" />
        <p className="session-micro-code">IDX {String(index + 1).padStart(2, "0")}</p>
      </div>

      <div className="relative z-10 p-4">
        <div className="session-micro-bottom-right">
          <div className="session-micro-dots" aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="session-title-micro text-sm text-[#F5D9A5]">{card.title.name}</p>
          <p className="session-title-micro text-[10px] text-[#E0B15C]/80">
            {card.title.release_year ?? "Unknown year"}
          </p>
          <p className="session-micro-kicker truncate">{whyLine}</p>
          {voteLabel ? (
            <p className="session-title-micro text-[10px] text-[#E0B15C]">
              VOTED {voteLabel}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
