import { Button, Pagination, Spinner } from "@heroui/react";
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
    <div className="space-y-4">
      <ul className="divide-y app-rule" aria-label="Watchlist titles">
        {items.map((item) => {
          const meta = getWatchlistMeta(item);
          const addedBy = getAddedByLabel(item);
          return (
            <li
              key={item.id ?? `${meta.name}-${meta.year ?? ""}`}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-5 transition-colors hover:bg-[#E0B15C]/[0.035] focus-within:bg-[#E0B15C]/[0.045] sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center"
            >
              {renderPoster(meta.poster, meta.name)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold leading-7 text-[#F7EAD2]">
                  {meta.name}
                </p>
                <p className="mt-1 text-sm app-muted">
                  {meta.year ? meta.year : "Unknown year"}
                  {addedBy ? ` · Added by ${addedBy}` : ""}
                </p>
              </div>
              <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
                <Button
                  size="sm"
                  variant="light"
                  className="app-danger-button"
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
              base: "rounded-2xl border border-[#E0B15C]/30 bg-[#22130F] px-2 py-1",
              wrapper: "gap-1",
              item: "border-none bg-transparent text-[#F7EAD2] data-[hover=true]:bg-[#2B1713]",
              cursor: "bg-[#E0B15C] text-[#1C110F]",
              prev: "border-none bg-transparent text-[#F7EAD2] data-[hover=true]:bg-[#2B1713]",
              next: "border-none bg-transparent text-[#F7EAD2] data-[hover=true]:bg-[#2B1713]",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
