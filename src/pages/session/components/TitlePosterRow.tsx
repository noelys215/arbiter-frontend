import type { ReactNode } from "react";
import { tmdbPosterUrl } from "../../../lib/tmdb";

type TitlePosterRowProps = {
  id: string;
  title: string;
  subtitle: string;
  posterPath?: string | null;
  rightContent?: ReactNode;
  highlighted?: boolean;
};

export default function TitlePosterRow({
  id,
  title,
  subtitle,
  posterPath,
  rightContent,
  highlighted = false,
}: TitlePosterRowProps) {
  const poster = tmdbPosterUrl(posterPath, "w342");

  return (
    <div
      key={id}
      className={`flex items-center gap-3 rounded-xl border p-2 ${
        highlighted
          ? "border-[#D4AF37]/80 bg-[#D4AF37]/10"
          : "border-[#D4AF37]/20 bg-black/35"
      }`}
    >
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="h-14 w-10 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-14 w-10 items-center justify-center rounded-md border border-[#D4AF37]/20 text-[10px] text-[#A0A0A0]">
          N/A
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{title}</p>
        <p className="text-xs text-[#A0A0A0]">{subtitle}</p>
      </div>
      {rightContent}
    </div>
  );
}
