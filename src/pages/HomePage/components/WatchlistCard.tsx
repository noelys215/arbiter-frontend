import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  updateWatchlistItem,
  type WatchlistSort,
} from "../../../features/watchlist/watchlist.api";
import type { WatchlistItem } from "../../../features/watchlist/watchlist.api";
import type { WatchlistMeta } from "../types";
import WatchlistControls from "./WatchlistControls";
import WatchlistList from "./WatchlistList";

type WatchlistCardProps = {
  selectedGroupName: string | null;
  selectedGroupId: string | null;
  currentUserId?: string | null;
  watchlistItems: WatchlistItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  isPagePending: boolean;
  hasActiveFilters: boolean;
  onPageChange: (value: number) => void;
  q: string;
  onQChange: (value: string) => void;
  mediaType: "all" | "movie" | "tv";
  onMediaTypeChange: (value: "all" | "movie" | "tv") => void;
  genreId: number | null;
  onGenreIdChange: (value: number | null) => void;
  sort: WatchlistSort;
  onSortChange: (value: WatchlistSort) => void;
  onClearFilters: () => void;
  genreOptions: Array<{ id: number; label: string }>;
  addTitleSlot: ReactNode;
  renderPoster: (
    posterPath?: string | null,
    altText?: string,
    size?: "compact" | "row",
  ) => ReactNode;
  getWatchlistMeta: (item: WatchlistItem) => WatchlistMeta;
};

export default function WatchlistCard({
  selectedGroupName,
  selectedGroupId,
  currentUserId,
  watchlistItems,
  totalCount,
  currentPage,
  totalPages,
  isLoading,
  isError,
  isPagePending,
  hasActiveFilters,
  onPageChange,
  q,
  onQChange,
  mediaType,
  onMediaTypeChange,
  genreId,
  onGenreIdChange,
  sort,
  onSortChange,
  onClearFilters,
  genreOptions,
  addTitleSlot,
  renderPoster,
  getWatchlistMeta,
}: WatchlistCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingRemoveId, setPendingRemoveId] = useState<
    string | number | null
  >(null);

  const removeMutation = useMutation({
    mutationFn: (itemId: string | number) =>
      updateWatchlistItem(itemId, { remove: true }),
    onMutate: (itemId) => {
      setPendingRemoveId(itemId);
    },
    onSuccess: () => {
      if (selectedGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["watchlist-library", selectedGroupId],
        });
        queryClient.invalidateQueries({
          queryKey: ["watchlist", selectedGroupId],
        });
      }
    },
    onSettled: () => {
      setPendingRemoveId(null);
    },
  });

  const getAddedByLabel = (item: WatchlistItem) => {
    const user = item.added_by_user ?? null;
    const label = user?.display_name ?? user?.username ?? user?.email ?? null;
    if (user?.id && currentUserId && user.id === currentUserId) {
      return "You";
    }
    return label;
  };

  return (
    <section className="app-surface overflow-hidden" aria-labelledby="watchlist-heading">
      <div className="border-b app-rule px-5 py-5 sm:px-6">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3
              id="watchlist-heading"
              className="sr-only text-xl font-semibold text-[#F7EAD2] sm:not-sr-only"
            >
              {selectedGroupName ?? "Select a group"}
            </h3>
            <p className="text-sm app-muted sm:mt-1">
              {totalCount === 1
                ? "1 title ready for the group."
                : `${totalCount} titles ready for the group.`}
            </p>
          </div>

          <Button
            size="md"
            className="app-primary-button h-11 w-full px-5 sm:w-auto"
            variant="primary"
            isDisabled={!selectedGroupId || totalCount < 2}
            onPress={() => {
              if (!selectedGroupId) return;
              navigate(`/app/session?groupId=${encodeURIComponent(selectedGroupId)}`);
            }}
          >
            Start Session
          </Button>
        </div>
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        {addTitleSlot}
        <WatchlistControls
          q={q}
          onQChange={onQChange}
          mediaType={mediaType}
          onMediaTypeChange={onMediaTypeChange}
          genreId={genreId}
          onGenreIdChange={onGenreIdChange}
          sort={sort}
          onSortChange={onSortChange}
          genreOptions={genreOptions}
          showingCount={watchlistItems.length}
          totalCount={totalCount}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
        />

        <WatchlistList
          selectedGroupId={selectedGroupId}
          items={watchlistItems}
          isLoading={isLoading}
          isError={isError}
          isPagePending={isPagePending}
          hasActiveFilters={hasActiveFilters}
          renderPoster={renderPoster}
          getWatchlistMeta={getWatchlistMeta}
          getAddedByLabel={getAddedByLabel}
          onRemove={(itemId) => removeMutation.mutate(itemId)}
          pendingRemoveId={pendingRemoveId}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}
