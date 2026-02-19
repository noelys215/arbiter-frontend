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
      <p className="text-sm text-[#D9C7A8]" role="status" aria-live="polite">
        Select a group to view its watchlist.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[#D9C7A8]" role="status" aria-live="polite">
        <Spinner size="sm" color="warning" /> Loading watchlist...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-[#D77B69]" role="alert">
        Unable to load watchlist.
      </p>
    );
  }

  if (isPagePending) {
    return (
      <div className="flex items-center gap-2 text-[#D9C7A8]" role="status" aria-live="polite">
        <Spinner size="sm" color="warning" /> Loading page...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#D9C7A8]" role="status" aria-live="polite">
        {hasActiveFilters ? "No matches found" : "Your watchlist is empty"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3" aria-label="Watchlist titles">
        {items.map((item) => {
          const meta = getWatchlistMeta(item);
          const addedBy = getAddedByLabel(item);
          return (
            <li
              key={item.id ?? `${meta.name}-${meta.year ?? ""}`}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E0B15C]/10 bg-black/30 p-3"
            >
              {renderPoster(meta.poster, meta.name)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{meta.name}</p>
                <p className="text-xs text-[#D9C7A8]">
                  {meta.year ? meta.year : "Unknown year"}
                </p>
                {addedBy ? (
                  <p className="text-xs text-[#D9C7A8]">Added by {addedBy}</p>
                ) : null}
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 uppercase">
                {item.status ? (
                  <Chip
                    variant="bordered"
                    radius="sm"
                    classNames={{
                      base: "border-[#E0B15C]/50",
                      content: "text-[#E0B15C]",
                    }}
                  >
                    {item.status}
                  </Chip>
                ) : null}
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-[#D77B69]/40 text-[#D77B69] hover:bg-[#D77B69]/10 uppercase"
                  onPress={() => onRemove(item.id)}
                  isLoading={pendingRemoveId === item.id}
                  aria-label={`Remove ${meta.name} from watchlist`}
                >
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 ? (
        <div className="flex justify-center pt-2">
          <Pagination
            page={currentPage}
            total={totalPages}
            onChange={onPageChange}
            isCompact
            showControls
            variant="bordered"
            size="sm"
            classNames={{
              base: "rounded-2xl border border-[#E0B15C]/25 bg-[#22130F] px-2 py-1",
              wrapper: "gap-1",
              item: "border-none bg-transparent text-[#F7F1E3] data-[hover=true]:bg-[#2B1713]",
              cursor: "bg-[#E0B15C] text-[#1C110F]",
              prev: "border-none bg-transparent text-[#F7F1E3] data-[hover=true]:bg-[#2B1713]",
              next: "border-none bg-transparent text-[#F7F1E3] data-[hover=true]:bg-[#2B1713]",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
