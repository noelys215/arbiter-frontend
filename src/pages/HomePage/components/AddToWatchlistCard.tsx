import { Button, Input, Spinner } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
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
  renderPoster: (posterPath?: string | null, altText?: string) => ReactNode;
  isOpen: boolean;
  onToggleOpen: () => void;
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
  isOpen,
  onToggleOpen,
}: AddToWatchlistCardProps) {
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
    <section className="rounded-xl border border-[#E0B15C]/18 bg-[#21130F]/80" aria-labelledby="add-title-heading">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 id="add-title-heading" className="text-base font-semibold text-[#F7EAD2]">
            Add a title
          </h3>
          <p className="text-sm app-muted">
            Search movies and shows, or add one by hand.
          </p>
        </div>
        <Button
          variant="bordered"
          className="app-outline-button w-full sm:w-auto"
          onPress={onToggleOpen}
          aria-expanded={isOpen}
          aria-controls="add-title-tools"
        >
          {isOpen ? "Hide add tools" : "Add a title"}
        </Button>
      </div>
      <div
        id="add-title-tools"
        hidden={!isOpen}
        className="space-y-4 border-t app-rule px-4 py-4"
      >
        <div className="space-y-2">
          <Input
            label="Search TMDB"
            placeholder="Search movies or TV shows"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            variant="bordered"
            classNames={inputClassNames}
          />
          {isSearching ? (
            <div
              className="flex items-center gap-2 text-sm text-[#D9C7A8]"
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
                <li key={`${item.tmdb_id}-${item.media_type}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent py-2 text-left transition hover:border-[#E0B15C]/25 hover:bg-[#E0B15C]/5"
                    onClick={() => {
                      if (!selectedGroupId) return;
                      addTmdbMutation.mutate(item);
                    }}
                    disabled={!selectedGroupId || addTmdbMutation.isPending}
                  >
                    {renderPoster(item.poster_path ?? null, item.title)}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#D9C7A8]">
                        {item.media_type.toUpperCase()}{" "}
                        {item.year ? `• ${item.year}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-[#E0B15C]">Add</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="bordered"
            className="app-outline-button"
            onPress={onOpenManual}
            isDisabled={isManualDisabled}
          >
            Add by hand
          </Button>
          {addTmdbMutation.isError ? (
            <p className="text-sm text-[#D77B69]" role="alert">
              Unable to add to watchlist.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
