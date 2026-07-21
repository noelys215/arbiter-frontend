import { Button, Spinner } from "@heroui/react";
import { AppTextField } from "../../../components/ui/AppField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { movieDetailPath } from "../../../features/movies/moviePresentation";
import { addTmdbToWatchlist } from "../../../features/watchlist/watchlist.api";
import type { TmdbSearchResult } from "../../../features/watchlist/watchlist.api";
import type { InputClassNames } from "../types";

type AddToWatchlistCardProps = {
  selectedGroupId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  tmdbResults: TmdbSearchResult[];
  isSearching: boolean;
  onClearSearch: () => void;
  onOpenManual: () => void;
  isManualDisabled: boolean;
  inputClassNames: InputClassNames;
  renderPoster: (
    posterPath?: string | null,
    altText?: string,
    size?: "compact" | "row",
  ) => ReactNode;
};

export default function AddToWatchlistCard({
  selectedGroupId,
  search,
  onSearchChange,
  tmdbResults,
  isSearching,
  onClearSearch,
  onOpenManual,
  isManualDisabled,
  inputClassNames,
  renderPoster,
}: AddToWatchlistCardProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const addTmdbMutation = useMutation({
    mutationFn: (item: TmdbSearchResult) =>
      addTmdbToWatchlist(selectedGroupId ?? "", item),
    onSuccess: () => {
      onClearSearch();
      queryClient.invalidateQueries({
        queryKey: ["watchlist-library", selectedGroupId],
      });
      queryClient.invalidateQueries({
        queryKey: ["watchlist", selectedGroupId],
      });
    },
  });

  return (
    <section className="rounded-xl border border-[#E0B15C]/16 bg-[#21130F]/78" aria-labelledby="add-title-heading">
      <div className="px-4 pt-4">
        <div className="min-w-0">
          <h3 id="add-title-heading" className="text-base font-semibold text-[#F7EAD2]">
            Add a title
          </h3>
          <p className="text-sm app-muted">
            Search movies and shows, or add one by hand.
          </p>
        </div>
      </div>
      <div
        id="add-title-tools"
        className="space-y-4 px-4 py-4"
      >
        <div className="space-y-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <AppTextField
              label="Search TMDB"
              placeholder="Search movies or TV shows"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="md:flex-1"
              classes={inputClassNames}
            />
            <Button
              variant="tertiary"
              className="app-secondary-button app-manual-button h-14 w-full md:w-44"
              onPress={onOpenManual}
              isDisabled={isManualDisabled}
            >
              Add by hand
            </Button>
          </div>
          {isSearching ? (
            <div
              className="flex items-center gap-2 text-sm app-text-secondary"
              role="status"
              aria-live="polite"
            >
              <Spinner size="sm" color="warning" /> Searching...
            </div>
          ) : null}
          {tmdbResults.length > 0 ? (
            <ul
              className="divide-y app-rule rounded-xl border border-[#E0B15C]/10 bg-black/20 px-2"
              aria-label="TMDB search results"
            >
              {tmdbResults.map((item) => (
                <li key={`${item.tmdb_id}-${item.media_type}`} className="flex items-center gap-3 rounded-lg border border-transparent py-2 transition hover:border-[#E0B15C]/20 hover:bg-[#E0B15C]/5">
                    {renderPoster(item.poster_path ?? null, item.title)}
                    <div className="min-w-0 flex-1">
                      {selectedGroupId ? (
                        <Link
                          to={movieDetailPath(selectedGroupId, `tmdb-${item.media_type}-${item.tmdb_id}`)}
                          state={{ backgroundLocation: location }}
                          className="rounded-sm text-sm font-semibold app-text-primary hover:text-[#F2C16E]"
                        >
                          {item.title}
                        </Link>
                      ) : <p className="text-sm font-semibold app-text-primary">{item.title}</p>}
                      <p className="text-xs app-text-metadata">
                        {item.media_type.toUpperCase()}{" "}
                        {item.year ? `• ${item.year}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="tertiary"
                      className="min-w-0 px-3 text-xs font-semibold text-[#F5D9A5]"
                      onPress={() => addTmdbMutation.mutate(item)}
                      isDisabled={!selectedGroupId || addTmdbMutation.isPending}
                      aria-label={`Add ${item.title} to watchlist`}
                    >
                      Add
                    </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {addTmdbMutation.isError ? (
          <p className="text-sm app-text-destructive" role="alert">
            Unable to add to watchlist.
          </p>
        ) : null}
      </div>
    </section>
  );
}
