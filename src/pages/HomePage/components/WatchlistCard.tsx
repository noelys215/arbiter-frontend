import { Button, Card, CardBody, CardHeader } from "@heroui/react";
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
  renderPoster: (posterPath?: string | null, altText?: string) => ReactNode;
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
    const fallback =
      user?.display_name ?? user?.username ?? user?.email ?? null;
    const id = user?.id ?? null;
    if (id && currentUserId && id === currentUserId) {
      return "You";
    }
    return fallback;
  };

  return (
    <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
      <CardHeader>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">Watchlist</h2>
            <p className="text-sm text-[#A0A0A0]">
              {selectedGroupName ?? "Select a group"} watchlist.
            </p>
          </div>

          <Button
            size="sm"
            variant="bordered"
            className="uppercase border-[#D4AF37]/60 text-[#0B0B0B] bg-[#D4AF37] hover:bg-[#D4AF37]/90"
            isDisabled={!selectedGroupId || totalCount < 2}
            onPress={() => {
              if (!selectedGroupId) return;
              navigate(`/app/session?groupId=${encodeURIComponent(selectedGroupId)}`);
            }}
          >
            Start Session
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
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
      </CardBody>
    </Card>
  );
}
