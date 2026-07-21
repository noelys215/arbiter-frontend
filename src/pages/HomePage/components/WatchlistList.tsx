import { Button, Pagination, Spinner } from "@heroui/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { WatchlistItem } from "../../../features/watchlist/watchlist.api";
import { movieDetailPath } from "../../../features/movies/moviePresentation";
import type { WatchlistMeta } from "../types";

type WatchlistListProps = {
  selectedGroupId: string | null;
  items: WatchlistItem[];
  isLoading: boolean;
  isError: boolean;
  isPagePending: boolean;
  hasActiveFilters: boolean;
  renderPoster: (
    posterPath?: string | null,
    altText?: string,
    size?: "compact" | "row",
  ) => ReactNode;
  getWatchlistMeta: (item: WatchlistItem) => WatchlistMeta;
  getAddedByLabel: (item: WatchlistItem) => string | null;
  onRemove: (itemId: string | number) => void;
  pendingRemoveId: string | number | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (value: number) => void;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: Array<number | "start-ellipsis" | "end-ellipsis"> = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
      pages.push(page);
    } else if (page < currentPage && !pages.includes("start-ellipsis")) {
      pages.push("start-ellipsis");
    } else if (page > currentPage && !pages.includes("end-ellipsis")) {
      pages.push("end-ellipsis");
    }
  }
  return pages;
}

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
  const location = useLocation();
  if (!selectedGroupId) {
    return (
      <p className="text-sm app-text-secondary" role="status" aria-live="polite">
        Select a group to view its watchlist.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 app-text-secondary" role="status" aria-live="polite">
        <Spinner size="sm" color="warning" /> Loading watchlist...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm app-text-destructive" role="alert">
        Unable to load watchlist.
      </p>
    );
  }

  if (isPagePending) {
    return (
      <div className="flex items-center gap-2 app-text-secondary" role="status" aria-live="polite">
        <Spinner size="sm" color="warning" /> Loading page...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm app-text-secondary" role="status" aria-live="polite">
        {hasActiveFilters ? "No matches found" : "Your watchlist is empty"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul aria-label="Watchlist titles">
        {items.map((item, index) => {
          const meta = getWatchlistMeta(item);
          const addedBy = getAddedByLabel(item);
          return (
            <li
              key={item.id ?? `${meta.name}-${index}`}
              className="relative grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-5 transition-colors hover:bg-[#E0B15C]/[0.035] focus-within:bg-[#E0B15C]/[0.055] sm:grid-cols-[5.5rem_minmax(0,1fr)_5.25rem] sm:items-start sm:pr-8 lg:py-[1.125rem] xl:pr-12"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-24 right-0 top-0 border-t border-[#E0B15C]/6 sm:left-[6.5rem] sm:right-8 xl:right-12"
                />
              ) : null}
              {renderPoster(meta.poster, meta.name, "row")}
              <div className="min-w-0 flex-1">
                <h3 className="text-[1.35rem] font-bold leading-7 text-[#F7EAD2] break-words">
                  <Link
                    to={movieDetailPath(selectedGroupId, `watchlist-${item.id}`)}
                    state={{ backgroundLocation: location }}
                    className="rounded-sm underline decoration-transparent underline-offset-4 transition-colors hover:text-[#F2C16E] hover:decoration-[#E0B15C]/45"
                    aria-label={`Open details for ${meta.name}`}
                  >
                    {meta.name}
                  </Link>
                </h3>
                {meta.editorialLine || addedBy ? (
                  <div className="mt-1 flex flex-col gap-1">
                    {meta.editorialLine ? (
                      <p className="break-words text-sm leading-5 app-text-secondary">
                        {meta.editorialLine}
                      </p>
                    ) : null}
                    {addedBy ? (
                      <p className="text-sm leading-5 app-text-metadata">
                        Added by {addedBy}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="col-span-2 flex flex-wrap items-center justify-start gap-2 pl-24 sm:col-span-1 sm:justify-end sm:pl-0 sm:pt-1">
                <Button
                  size="sm"
                  variant="tertiary"
                  className="app-danger-button min-w-0 px-2"
                  onPress={() => onRemove(item.id)}
                  isPending={pendingRemoveId === item.id}
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
        <div className="flex justify-center pt-1">
          <Pagination aria-label="Watchlist pages" size="sm">
            <Pagination.Content className="gap-1 rounded-lg border border-[#E0B15C]/30 bg-[#22130F] px-2 py-1">
              <Pagination.Item>
                <Pagination.Previous
                  aria-label="Previous page"
                  isDisabled={currentPage === 1}
                  onPress={() => onPageChange(currentPage - 1)}
                  className="text-[#F7EAD2] hover:bg-[#2B1713] disabled:text-[#8F7A62]"
                >
                  <Pagination.PreviousIcon />
                </Pagination.Previous>
              </Pagination.Item>
              {getVisiblePages(currentPage, totalPages).map((page) => (
                typeof page === "number" ? (
                  <Pagination.Item key={page}>
                    <Pagination.Link
                      aria-label={`Page ${page}`}
                      aria-current={page === currentPage ? "page" : undefined}
                      isActive={page === currentPage}
                      onPress={() => onPageChange(page)}
                      className={page === currentPage
                        ? "bg-[#E0B15C] text-[#1C110F]"
                        : "text-[#F7EAD2] hover:bg-[#2B1713]"}
                    >
                      {page}
                    </Pagination.Link>
                  </Pagination.Item>
                ) : (
                  <Pagination.Item key={page}>
                    <Pagination.Ellipsis className="text-[#BFA986]" />
                  </Pagination.Item>
                )
              ))}
              <Pagination.Item>
                <Pagination.Next
                  aria-label="Next page"
                  isDisabled={currentPage === totalPages}
                  onPress={() => onPageChange(currentPage + 1)}
                  className="text-[#F7EAD2] hover:bg-[#2B1713] disabled:text-[#8F7A62]"
                >
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
