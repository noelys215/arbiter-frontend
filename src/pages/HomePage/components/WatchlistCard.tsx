import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { updateWatchlistItem } from "../../../features/watchlist/watchlist.api";
import type { WatchlistItem } from "../../../features/watchlist/watchlist.api";
import type { WatchlistMeta } from "../types";

type WatchlistCardProps = {
  selectedGroupName: string | null;
  selectedGroupId: string | null;
  currentUserId?: string | null;
  watchlistItems: WatchlistItem[];
  isLoading: boolean;
  isError: boolean;
  renderPoster: (posterPath?: string | null, altText?: string) => ReactNode;
  getWatchlistMeta: (item: WatchlistItem) => WatchlistMeta;
};

export default function WatchlistCard({
  selectedGroupName,
  selectedGroupId,
  currentUserId,
  watchlistItems,
  isLoading,
  isError,
  renderPoster,
  getWatchlistMeta,
}: WatchlistCardProps) {
  const queryClient = useQueryClient();
  const [pendingRemoveId, setPendingRemoveId] = useState<
    string | number | null
  >(null);

  console.log(watchlistItems);

  const removeMutation = useMutation({
    mutationFn: (itemId: string | number) =>
      updateWatchlistItem(itemId, { remove: true }),
    onMutate: (itemId) => {
      setPendingRemoveId(itemId);
    },
    onSuccess: () => {
      if (selectedGroupId) {
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
            isDisabled={!selectedGroupId || watchlistItems.length < 2}
          >
            Start Session
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {!selectedGroupId ? (
          <p className="text-sm text-[#A0A0A0]">
            Select a group to view its watchlist.
          </p>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-[#A0A0A0]">
            <Spinner size="sm" color="warning" /> Loading watchlist...
          </div>
        ) : isError ? (
          <p className="text-sm text-[#7B1E2B]">Unable to load watchlist.</p>
        ) : watchlistItems.length === 0 ? (
          <p className="text-sm text-[#A0A0A0]">
            No items yet. Add your first title.
          </p>
        ) : (
          <div className="space-y-3">
            {watchlistItems.map((item) => {
              const meta = getWatchlistMeta(item);
              const addedBy = getAddedByLabel(item);
              return (
                <div
                  key={item.id ?? `${meta.name}-${meta.year ?? ""}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#D4AF37]/10 bg-black/30 p-3"
                >
                  {renderPoster(meta.poster, meta.name)}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {meta.name}
                    </p>
                    <p className="text-xs text-[#A0A0A0]">
                      {meta.year ? meta.year : "Unknown year"}
                    </p>
                    {addedBy ? (
                      <p className="text-xs text-[#A0A0A0]">
                        Added by {addedBy}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 uppercase">
                    {item.status ? (
                      <Chip
                        variant="bordered"
                        radius="sm"
                        classNames={{
                          base: "border-[#D4AF37]/50",
                          content: "text-[#D4AF37]",
                        }}
                      >
                        {item.status}
                      </Chip>
                    ) : null}
                    <Button
                      size="sm"
                      variant="bordered"
                      className="border-[#7B1E2B]/40 text-[#7B1E2B] hover:bg-[#7B1E2B]/10 uppercase"
                      onPress={() => removeMutation.mutate(item.id)}
                      isLoading={pendingRemoveId === item.id}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
