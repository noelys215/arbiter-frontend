import { Button, Input, Select, SelectItem } from "@heroui/react";
import type { WatchlistSort } from "../../../features/watchlist/watchlist.api";
import { theaterSelectClassNames } from "../../../lib/selectTheme";

type GenreOption = {
  id: number;
  label: string;
};

type WatchlistControlsProps = {
  q: string;
  onQChange: (value: string) => void;
  mediaType: "all" | "movie" | "tv";
  onMediaTypeChange: (value: "all" | "movie" | "tv") => void;
  genreId: number | null;
  onGenreIdChange: (value: number | null) => void;
  sort: WatchlistSort;
  onSortChange: (value: WatchlistSort) => void;
  genreOptions: GenreOption[];
  showingCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export default function WatchlistControls({
  q,
  onQChange,
  mediaType,
  onMediaTypeChange,
  genreId,
  onGenreIdChange,
  sort,
  onSortChange,
  genreOptions,
  showingCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: WatchlistControlsProps) {
  return (
    <div className="space-y-3 rounded-xl border border-[#E0B15C]/15 bg-[#1C110F]/70 p-3">
      <Input
        aria-label="Search watchlist"
        placeholder="Search watchlist..."
        value={q}
        size="sm"
        onValueChange={onQChange}
        classNames={{
          input:
            "!text-[#F5F5F5] placeholder:text-white/35 caret-[#E0B15C]",
          inputWrapper:
            "!bg-[#1A100E] !text-[#F5F5F5] border-[#E0B15C]/20 data-[hover=true]:border-[#E0B15C]/45 data-[focus=true]:!bg-[#1A100E] data-[focus=true]:border-[#E0B15C]/55",
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={mediaType === "all" ? "solid" : "bordered"}
          className={
            mediaType === "all"
              ? "bg-[#E0B15C] text-[#161616]"
              : "border-[#E0B15C]/35 text-[#E0B15C]"
          }
          aria-pressed={mediaType === "all"}
          onPress={() => onMediaTypeChange("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={mediaType === "movie" ? "solid" : "bordered"}
          className={
            mediaType === "movie"
              ? "bg-[#E0B15C] text-[#161616]"
              : "border-[#E0B15C]/35 text-[#E0B15C]"
          }
          aria-pressed={mediaType === "movie"}
          onPress={() => onMediaTypeChange("movie")}
        >
          Movies
        </Button>
        <Button
          size="sm"
          variant={mediaType === "tv" ? "solid" : "bordered"}
          className={
            mediaType === "tv"
              ? "bg-[#E0B15C] text-[#161616]"
              : "border-[#E0B15C]/35 text-[#E0B15C]"
          }
          aria-pressed={mediaType === "tv"}
          onPress={() => onMediaTypeChange("tv")}
        >
          TV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          aria-label="Filter by genre"
          size="sm"
          selectedKeys={genreId ? [String(genreId)] : []}
          placeholder="All genres"
          onSelectionChange={(keys) => {
            const [value] = Array.from(keys);
            if (typeof value === "string" && value.trim().length > 0) {
              const parsed = Number.parseInt(value, 10);
              onGenreIdChange(Number.isFinite(parsed) ? parsed : null);
              return;
            }
            onGenreIdChange(null);
          }}
          classNames={theaterSelectClassNames}
        >
          {genreOptions.map((option) => (
            <SelectItem key={String(option.id)}>{option.label}</SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Sort watchlist"
          size="sm"
          selectedKeys={[sort]}
          onSelectionChange={(keys) => {
            const [value] = Array.from(keys);
            if (value === "oldest" || value === "recent") {
              onSortChange(value);
            }
          }}
          classNames={theaterSelectClassNames}
        >
          <SelectItem key="recent">Recent added</SelectItem>
          <SelectItem key="oldest">Oldest to newest</SelectItem>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className="uppercase tracking-[0.08em] text-[#D9C7A8]"
          role="status"
          aria-live="polite"
        >
          Showing {showingCount} of {totalCount}
        </span>
        {hasActiveFilters ? (
          <Button
            size="sm"
            variant="light"
            className="text-[#E0B15C]"
            onPress={onClearFilters}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
