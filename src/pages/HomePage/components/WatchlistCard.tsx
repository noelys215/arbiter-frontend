import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import type { ReactNode } from "react";
import type { WatchlistItem } from "../../../features/watchlist/watchlist.api";
import type { WatchlistMeta } from "../types";

type WatchlistCardProps = {
  selectedGroupName: string | null;
  selectedGroupId: string | null;
  watchlistItems: WatchlistItem[];
  isLoading: boolean;
  isError: boolean;
  renderPoster: (posterPath?: string | null, altText?: string) => ReactNode;
  getWatchlistMeta: (item: WatchlistItem) => WatchlistMeta;
};

export default function WatchlistCard({
  selectedGroupName,
  selectedGroupId,
  watchlistItems,
  isLoading,
  isError,
  renderPoster,
  getWatchlistMeta,
}: WatchlistCardProps) {
  return (
    <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-white">Watchlist</h2>
          <p className="text-sm text-[#A0A0A0]">
            {selectedGroupName ?? "Select a group"} watchlist.
          </p>
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
                  </div>
                  {item.status ? (
                    <Chip
                      variant="bordered"
                      classNames={{
                        base: "border-[#D4AF37]/50",
                        content: "text-[#D4AF37]",
                      }}
                    >
                      {item.status}
                    </Chip>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
