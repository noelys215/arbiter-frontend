import { Button } from "@heroui/react";
import { AppTextField } from "../../../components/ui/AppField";
import AppSelect from "../../../components/ui/AppSelect";
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
    <div className="space-y-3 border-b app-rule pb-4">
      <AppTextField
        aria-label="Search watchlist"
        placeholder="Search watchlist..."
        value={q}
        onChangeValue={onQChange}
        classes={{
          input:
            "!text-[#F7F1E3] placeholder:text-[#D9C7A8]/70 caret-[#E0B15C]",
          inputWrapper:
            "!bg-[#1A100E] !text-[#F7F1E3] border-[#E0B15C]/35 hover:border-[#E0B15C]/55 focus:!bg-[#1A100E] focus:border-[#E0B15C]/75",
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={mediaType === "all" ? "primary" : "tertiary"}
          className={
            mediaType === "all"
              ? "app-primary-button"
              : "app-secondary-button"
          }
          aria-pressed={mediaType === "all"}
          onPress={() => onMediaTypeChange("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={mediaType === "movie" ? "primary" : "tertiary"}
          className={
            mediaType === "movie"
              ? "app-primary-button"
              : "app-secondary-button"
          }
          aria-pressed={mediaType === "movie"}
          onPress={() => onMediaTypeChange("movie")}
        >
          Movies
        </Button>
        <Button
          size="sm"
          variant={mediaType === "tv" ? "primary" : "tertiary"}
          className={
            mediaType === "tv"
              ? "app-primary-button"
              : "app-secondary-button"
          }
          aria-pressed={mediaType === "tv"}
          onPress={() => onMediaTypeChange("tv")}
        >
          TV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AppSelect
          ariaLabel="Filter by genre"
          value={genreId ? String(genreId) : null}
          placeholder="All genres"
          onChange={(value) => {
            if (value && value.trim().length > 0) {
              const parsed = Number.parseInt(value, 10);
              onGenreIdChange(Number.isFinite(parsed) ? parsed : null);
              return;
            }
            onGenreIdChange(null);
          }}
          options={genreOptions.map((option) => ({ id: String(option.id), label: option.label }))}
          triggerClassName={theaterSelectClassNames.trigger}
          valueClassName={theaterSelectClassNames.value}
          listBoxClassName={theaterSelectClassNames.listbox}
          popoverClassName={theaterSelectClassNames.popoverContent}
          indicatorClassName={theaterSelectClassNames.selectorIcon}
        />

        <AppSelect
          ariaLabel="Sort watchlist"
          value={sort}
          onChange={(value) => {
            if (value === "oldest" || value === "recent") {
              onSortChange(value);
            }
          }}
          options={[
            { id: "recent", label: "Recent added" },
            { id: "oldest", label: "Oldest to newest" },
          ]}
          triggerClassName={theaterSelectClassNames.trigger}
          valueClassName={theaterSelectClassNames.value}
          listBoxClassName={theaterSelectClassNames.listbox}
          popoverClassName={theaterSelectClassNames.popoverContent}
          indicatorClassName={theaterSelectClassNames.selectorIcon}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className="uppercase tracking-[0.08em] app-muted"
          role="status"
          aria-live="polite"
        >
          Showing {showingCount} of {totalCount}
        </span>
        {hasActiveFilters ? (
          <Button
            size="sm"
            variant="tertiary"
          className="app-secondary-button"
            onPress={onClearFilters}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
