import { Button, Input, Select, SelectItem } from "@heroui/react";
import type { WatchlistSort } from "../../../features/watchlist/watchlist.api";

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
    <div className="space-y-3 rounded-xl border border-[#D4AF37]/15 bg-black/20 p-3">
      <Input
        aria-label="Search watchlist"
        placeholder="Search watchlist..."
        value={q}
        size="sm"
        onValueChange={onQChange}
        classNames={{
          input:
            "!text-[#F5F5F5] placeholder:text-white/35 caret-[#D4AF37]",
          inputWrapper:
            "!bg-[#090909] !text-[#F5F5F5] border-[#D4AF37]/20 data-[hover=true]:border-[#D4AF37]/45 data-[focus=true]:!bg-[#090909] data-[focus=true]:border-[#D4AF37]/55",
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={mediaType === "all" ? "solid" : "bordered"}
          className={
            mediaType === "all"
              ? "bg-[#D4AF37] text-[#161616]"
              : "border-[#D4AF37]/35 text-[#D4AF37]"
          }
          onPress={() => onMediaTypeChange("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={mediaType === "movie" ? "solid" : "bordered"}
          className={
            mediaType === "movie"
              ? "bg-[#D4AF37] text-[#161616]"
              : "border-[#D4AF37]/35 text-[#D4AF37]"
          }
          onPress={() => onMediaTypeChange("movie")}
        >
          Movies
        </Button>
        <Button
          size="sm"
          variant={mediaType === "tv" ? "solid" : "bordered"}
          className={
            mediaType === "tv"
              ? "bg-[#D4AF37] text-[#161616]"
              : "border-[#D4AF37]/35 text-[#D4AF37]"
          }
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
          classNames={{
            trigger:
              "border-[#D4AF37]/30 bg-[#0F0F10] text-[#D4AF37] data-[focus=true]:border-[#D4AF37]",
            value: "!text-[#D4AF37] data-[placeholder=true]:text-[#D4AF37]/70",
            listbox: "bg-[#0F0F10] text-[#D4AF37]",
            popoverContent: "bg-[#0F0F10] border border-[#D4AF37]/20",
            selectorIcon: "text-[#D4AF37]/70",
          }}
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
          classNames={{
            trigger:
              "border-[#D4AF37]/30 bg-[#0F0F10] text-[#D4AF37] data-[focus=true]:border-[#D4AF37]",
            value: "!text-[#D4AF37]",
            listbox: "bg-[#0F0F10] text-[#D4AF37]",
            popoverContent: "bg-[#0F0F10] border border-[#D4AF37]/20",
            selectorIcon: "text-[#D4AF37]/70",
          }}
        >
          <SelectItem key="recent">Recent added</SelectItem>
          <SelectItem key="oldest">Oldest to newest</SelectItem>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="uppercase tracking-[0.08em] text-[#A0A0A0]">
          Showing {showingCount} of {totalCount}
        </span>
        {hasActiveFilters ? (
          <Button
            size="sm"
            variant="light"
            className="text-[#D4AF37]"
            onPress={onClearFilters}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
