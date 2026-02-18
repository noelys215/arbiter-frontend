import { Button, Chip, Pagination, Spinner } from "@heroui/react";
import type { ReactNode } from "react";
import type { WatchlistItem } from "../../../features/watchlist/watchlist.api";
import type { WatchlistMeta } from "../types";

type WatchlistListProps = {
  selectedGroupId: string | null;
  items: WatchlistItem[];
  isLoading: boolean;
  isError: boolean;
  isPagePending: boolean;
  hasActiveFilters: boolean;
  renderPoster: (posterPath?: string | null, altText?: string) => ReactNode;
  getWatchlistMeta: (item: WatchlistItem) => WatchlistMeta;
  getAddedByLabel: (item: WatchlistItem) => string | null;
  onRemove: (itemId: string | number) => void;
  pendingRemoveId: string | number | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (value: number) => void;
};

export default function WatchlistList({
  selectedGroupId,
  items,
  isLoading,
  isError,
  isPagePending,
  hasActiveFilters,
  renderPoster,
  getWatchlistMeta,
  getAddedByLabel,
  onRemove,
  pendingRemoveId,
  currentPage,
  totalPages,
  onPageChange,
}: WatchlistListProps) {
  if (!selectedGroupId) {
    return (
      <p className="text-sm text-[#A0A0A0]">Select a group to view its watchlist.</p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[#A0A0A0]">
        <Spinner size="sm" color="warning" /> Loading watchlist...
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-[#7B1E2B]">Unable to load watchlist.</p>;
  }

  if (isPagePending) {
    return (
      <div className="flex items-center gap-2 text-[#A0A0A0]">
        <Spinner size="sm" color="warning" /> Loading page...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#A0A0A0]">
        {hasActiveFilters ? "No matches found" : "Your watchlist is empty"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const meta = getWatchlistMeta(item);
        const addedBy = getAddedByLabel(item);
        return (
          <div
            key={item.id ?? `${meta.name}-${meta.year ?? ""}`}
            className="flex items-center gap-4 rounded-2xl border border-[#D4AF37]/10 bg-black/30 p-3"
          >
            {renderPoster(meta.poster, meta.name)}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{meta.name}</p>
              <p className="text-xs text-[#A0A0A0]">
                {meta.year ? meta.year : "Unknown year"}
              </p>
              {addedBy ? (
                <p className="text-xs text-[#A0A0A0]">Added by {addedBy}</p>
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
                onPress={() => onRemove(item.id)}
                isLoading={pendingRemoveId === item.id}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}

      {totalPages > 1 ? (
        <div className="flex justify-center pt-2">
          <Pagination
            page={currentPage}
            total={totalPages}
            onChange={onPageChange}
            showControls
            size="sm"
            classNames={{
              item: "text-[#D4AF37]",
              cursor: "bg-[#D4AF37] text-[#111111]",
              prev: "text-[#D4AF37]",
              next: "text-[#D4AF37]",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
