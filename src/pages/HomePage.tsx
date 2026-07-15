import { Select, SelectItem, useDisclosure } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMe } from "../features/auth/auth.api";
import { getGroups } from "../features/groups/groups.api";
import { getFriends } from "../features/friends/friends.api";
import {
  getGroupWatchlistPage,
  searchTmdb,
  type WatchlistSort,
} from "../features/watchlist/watchlist.api";
import type { WatchlistItem } from "../features/watchlist/watchlist.api";
import { tmdbPosterUrl } from "../lib/tmdb";
import { theaterSelectClassNames } from "../lib/selectTheme";
import { TMDB_GENRE_LABEL_BY_ID } from "./session/constants";
import AddToWatchlistCard from "./HomePage/components/AddToWatchlistCard";
import AvatarMenuModal from "./HomePage/components/AvatarMenuModal";
import ManualAddModal from "./HomePage/components/ManualAddModal";
import NoGroupsCard from "./HomePage/components/NoGroupsCard";
import RightRail from "./HomePage/components/RightRail";
import TopBar from "./HomePage/components/TopBar";
import WatchlistCard from "./HomePage/components/WatchlistCard";
import { useWatchlistRealtime } from "./HomePage/hooks/useWatchlistRealtime";
import type { InputClassNames, WatchlistMeta } from "./HomePage/types";
import SkipLink from "../components/SkipLink";

const GROUP_STORAGE_KEY = "arbiter:lastGroupId";

export default function HomePage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() =>
    localStorage.getItem(GROUP_STORAGE_KEY),
  );
  const [tmdbSearch, setTmdbSearch] = useState("");
  const [debouncedTmdbSearch, setDebouncedTmdbSearch] = useState("");
  const debounceTimerRef = useRef<number | null>(null);
  const [watchlistQ, setWatchlistQ] = useState("");
  const [debouncedWatchlistQ, setDebouncedWatchlistQ] = useState("");
  const [watchlistMediaType, setWatchlistMediaType] = useState<
    "all" | "movie" | "tv"
  >("all");
  const [watchlistGenreId, setWatchlistGenreId] = useState<number | null>(null);
  const [watchlistSort, setWatchlistSort] = useState<WatchlistSort>("recent");
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [isAddTitleOpen, setIsAddTitleOpen] = useState(false);
  const manualModal = useDisclosure();
  const avatarModal = useDisclosure();

  const inputClassNames: InputClassNames = {
    label: "text-[#F5D9A5]",
    input: "text-[#F7F1E3] placeholder:text-[#D9C7A8]/65",
    inputWrapper:
      "border-[#E0B15C]/35 bg-[#22130F] focus-within:border-[#E0B15C]",
  };

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const {
    data: groups,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useQuery({ queryKey: ["groups"], queryFn: getGroups });

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });

  const tmdbQuery = useQuery({
    queryKey: ["tmdb-search", debouncedTmdbSearch],
    queryFn: () => searchTmdb(debouncedTmdbSearch),
    enabled: debouncedTmdbSearch.trim().length >= 2,
  });

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setTmdbSearch(value);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedTmdbSearch(value.trim());
    }, 300);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedWatchlistQ(watchlistQ.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [watchlistQ]);

  const resolvedSelectedGroupId = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    if (
      selectedGroupId &&
      groups.some((group) => group.id === selectedGroupId)
    ) {
      return selectedGroupId;
    }
    const stored = localStorage.getItem(GROUP_STORAGE_KEY);
    if (stored && groups.some((group) => group.id === stored)) {
      return stored;
    }
    return groups[0]?.id ?? null;
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (resolvedSelectedGroupId) {
      localStorage.setItem(GROUP_STORAGE_KEY, resolvedSelectedGroupId);
    }
  }, [resolvedSelectedGroupId]);

  const selectedGroup = useMemo(
    () => groups?.find((group) => group.id === resolvedSelectedGroupId) ?? null,
    [groups, resolvedSelectedGroupId],
  );

  useWatchlistRealtime(resolvedSelectedGroupId);

  const renderPoster = (posterPath?: string | null, altText?: string) => {
    const poster = tmdbPosterUrl(posterPath ?? null);
    if (poster) {
      return (
        <img
          src={poster}
          alt={altText ?? "Poster"}
          className="h-24 w-16 rounded-md object-cover shadow-[0_10px_24px_rgb(0_0_0/0.26)]"
        />
      );
    }
    return (
      <div className="flex h-24 w-16 items-center justify-center rounded-md border border-[#E0B15C]/25 bg-[#22130F] text-xs text-[#D9C7A8]">
        N/A
      </div>
    );
  };

  const watchlistQuery = useInfiniteQuery({
    queryKey: [
      "watchlist-library",
      resolvedSelectedGroupId,
      debouncedWatchlistQ,
      watchlistMediaType,
      watchlistGenreId,
      watchlistSort,
    ],
    queryFn: ({ pageParam }) =>
      getGroupWatchlistPage(resolvedSelectedGroupId ?? "", {
        q: debouncedWatchlistQ || undefined,
        media_type: watchlistMediaType === "all" ? null : watchlistMediaType,
        genre_id: watchlistGenreId,
        sort: watchlistSort,
        limit: 10,
        cursor: (pageParam as string | null) ?? null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: Boolean(resolvedSelectedGroupId),
  });

  const watchlistPages = watchlistQuery.data?.pages ?? [];
  const {
    isLoading: isWatchlistLoading,
    isError: isWatchlistError,
    isFetchingNextPage: isWatchlistFetchingNextPage,
    fetchNextPage,
  } = watchlistQuery;
  const loadedPageCount = watchlistPages.length;
  const watchlistItems = watchlistPages[watchlistPage - 1]?.items ?? [];
  const watchlistTotalCount = watchlistPages[0]?.total_count ?? 0;
  const watchlistTotalPages = Math.max(
    1,
    Math.ceil(watchlistTotalCount / 10),
  );
  const hasNextPage = Boolean(watchlistQuery.hasNextPage);
  const isPagePending = watchlistPage > loadedPageCount;
  const hasActiveFilters =
    watchlistQ.trim().length > 0 ||
    watchlistMediaType !== "all" ||
    watchlistGenreId !== null ||
    watchlistSort !== "recent";
  const genreOptions = useMemo(
    () =>
      Object.entries(TMDB_GENRE_LABEL_BY_ID)
        .map(([id, label]) => ({ id: Number(id), label }))
        .filter((row) => Number.isFinite(row.id))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  useEffect(() => {
    queueMicrotask(() => setWatchlistPage(1));
  }, [
    resolvedSelectedGroupId,
    debouncedWatchlistQ,
    watchlistMediaType,
    watchlistGenreId,
    watchlistSort,
  ]);

  useEffect(() => {
    if (watchlistPage > watchlistTotalPages) {
      queueMicrotask(() => setWatchlistPage(watchlistTotalPages));
    }
  }, [watchlistPage, watchlistTotalPages]);

  useEffect(() => {
    if (
      watchlistPage <= loadedPageCount ||
      !hasNextPage ||
      isWatchlistFetchingNextPage ||
      isWatchlistLoading
    ) {
      return;
    }
    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isWatchlistFetchingNextPage,
    isWatchlistLoading,
    loadedPageCount,
    watchlistPage,
  ]);

  const tmdbResults = Array.isArray(tmdbQuery.data) ? tmdbQuery.data : [];

  const getWatchlistMeta = (item: WatchlistItem): WatchlistMeta => {
    const title = item.title ?? item.title_info ?? null;
    const name =
      title?.name ??
      item.title_text ??
      (typeof item.title === "string" ? item.title : "") ??
      "Untitled";
    const year = title?.release_year ?? item.year ?? null;
    const poster = title?.poster_path ?? item.poster_path ?? null;
    return { name, year, poster };
  };

  return (
    <div className="app-page">
      <SkipLink />
      <TopBar
        me={me}
        onAvatarClick={avatarModal.onOpen}
      />

      <div id="main-content" tabIndex={-1} className="app-shell py-7 sm:py-9">
        {groupsLoading ? (
          <div
            className="flex items-center gap-3 text-[#D9C7A8]"
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex h-4 w-4 animate-pulse rounded-full bg-[#E0B15C]/40" />
            Loading groups...
          </div>
        ) : groupsError ? (
          <p className="text-sm text-[#D77B69]" role="alert">
            Unable to load groups. Please refresh.
          </p>
        ) : groups && groups.length === 0 ? (
          <NoGroupsCard inputClassNames={inputClassNames} />
        ) : (
          <div className="space-y-7">
            <header className="flex flex-col gap-4 border-b app-rule pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#E0B15C]/75">
                  {selectedGroup?.name ?? "Choose a group"}
                </p>
                <h2 className="app-heading-serif mt-1 text-4xl leading-none text-[#F7EAD2] sm:text-5xl">
                  Watchlist
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 app-muted sm:text-base">
                  Add the contenders, keep the group together, and start the vote when there are enough titles.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <span
                  id="app-group-label"
                  className="text-xs font-semibold uppercase tracking-[0.16em] app-tertiary"
                >
                  Current group
                </span>
                <Select
                  aria-labelledby="app-group-label"
                  placeholder="Select a group"
                  selectedKeys={resolvedSelectedGroupId ? [resolvedSelectedGroupId] : []}
                  renderValue={(items) =>
                    items.map((item) => (
                      <span key={item.key} className="text-[#F5D9A5]">
                        {item.textValue}
                      </span>
                    ))
                  }
                  onSelectionChange={(keys) => {
                    const [value] = Array.from(keys);
                    if (typeof value === "string") {
                      setSelectedGroupId(value);
                    }
                  }}
                  isDisabled={!groups || groups.length === 0}
                  size="sm"
                  variant="bordered"
                  className="w-full sm:w-56"
                  classNames={theaterSelectClassNames}
                >
                  {(groups ?? []).map((group) => (
                    <SelectItem key={group.id}>{group.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2.45fr)_minmax(18rem,0.75fr)]">
            <main className="flex flex-col gap-5">
              <p className="sr-only" role="status" aria-live="polite">
                {selectedGroup?.name
                  ? `${selectedGroup.name} watchlist loaded.`
                  : "Watchlist loaded."}
              </p>
              <WatchlistCard
                selectedGroupName={selectedGroup?.name ?? null}
                selectedGroupId={resolvedSelectedGroupId}
                currentUserId={me?.id ?? null}
                watchlistItems={watchlistItems}
                totalCount={watchlistTotalCount}
                currentPage={watchlistPage}
                totalPages={watchlistTotalPages}
                isLoading={isWatchlistLoading}
                isError={isWatchlistError}
                isPagePending={isPagePending}
                hasActiveFilters={hasActiveFilters}
                onPageChange={setWatchlistPage}
                q={watchlistQ}
                onQChange={setWatchlistQ}
                mediaType={watchlistMediaType}
                onMediaTypeChange={setWatchlistMediaType}
                genreId={watchlistGenreId}
                onGenreIdChange={setWatchlistGenreId}
                sort={watchlistSort}
                onSortChange={setWatchlistSort}
                onClearFilters={() => {
                  setWatchlistQ("");
                  setDebouncedWatchlistQ("");
                  setWatchlistMediaType("all");
                  setWatchlistGenreId(null);
                  setWatchlistSort("recent");
                }}
                genreOptions={genreOptions}
                addTitleSlot={
                  <AddToWatchlistCard
                    selectedGroupId={resolvedSelectedGroupId}
                    search={tmdbSearch}
                    onSearchChange={handleSearchChange}
                    tmdbResults={tmdbResults}
                    isSearching={tmdbQuery.isFetching}
                    onClearSearch={() => handleSearchChange("")}
                    onOpenManual={manualModal.onOpen}
                    isManualDisabled={!resolvedSelectedGroupId}
                    inputClassNames={inputClassNames}
                    renderPoster={renderPoster}
                    isOpen={isAddTitleOpen}
                    onToggleOpen={() => setIsAddTitleOpen((value) => !value)}
                  />
                }
                renderPoster={renderPoster}
                getWatchlistMeta={getWatchlistMeta}
              />
            </main>

            <div className="lg:pt-1">
              <RightRail friends={friends} selectedGroup={selectedGroup} />
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualAddModal
        isOpen={manualModal.isOpen}
        onOpenChange={manualModal.onOpenChange}
        selectedGroupId={resolvedSelectedGroupId}
        inputClassNames={inputClassNames}
      />

      <AvatarMenuModal
        isOpen={avatarModal.isOpen}
        onOpenChange={avatarModal.onOpenChange}
        me={me}
        groups={groups}
        friends={friends}
        selectedGroup={selectedGroup}
        onGroupCleared={() => setSelectedGroupId(null)}
      />
    </div>
  );
}
