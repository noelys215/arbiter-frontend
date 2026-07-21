import { useOverlayState } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getMe } from "../features/auth/auth.api";
import {
  getGroupInvitations,
  getGroups,
} from "../features/groups/groups.api";
import {
  getFriendRequests,
  getFriends,
} from "../features/friends/friends.api";
import {
  getGroupWatchlistPage,
  searchTmdb,
  type WatchlistSort,
} from "../features/watchlist/watchlist.api";
import type { WatchlistItem } from "../features/watchlist/watchlist.api";
import { getWatchlistRowMetadata } from "../features/watchlist/watchlistMetadata";
import { tmdbPosterUrl } from "../lib/tmdb";
import { theaterSelectClassNames } from "../lib/selectTheme";
import AppSelect from "../components/ui/AppSelect";
import { TMDB_GENRE_LABEL_BY_ID } from "./session/constants";
import AddToWatchlistCard from "./HomePage/components/AddToWatchlistCard";
import ManualAddModal from "./HomePage/components/ManualAddModal";
import NoGroupsCard from "./HomePage/components/NoGroupsCard";
import RightRail from "./HomePage/components/RightRail";
import TopBar from "./HomePage/components/TopBar";
import WatchlistCard from "./HomePage/components/WatchlistCard";
import { useWatchlistRealtime } from "./HomePage/hooks/useWatchlistRealtime";
import type { InputClassNames, WatchlistMeta } from "./HomePage/types";
import SkipLink from "../components/SkipLink";
import { feedbackAvailability } from "../config/appMetadata";
import LazyLoadingState from "../components/LazyLoadingState";

const AvatarMenuModal = lazy(
  () => import("./HomePage/components/AvatarMenuModal"),
);
const FeedbackDialog = lazy(
  () => import("../features/feedback/FeedbackDialog"),
);

const GROUP_STORAGE_KEY = "arbiter:lastGroupId";

export default function HomePage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() =>
    localStorage.getItem(GROUP_STORAGE_KEY),
  );
  const [tmdbSearch, setTmdbSearch] = useState("");
  const [debouncedTmdbSearch, setDebouncedTmdbSearch] = useState("");
  const debounceTimerRef = useRef<number | null>(null);
  const accountTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [watchlistQ, setWatchlistQ] = useState("");
  const [debouncedWatchlistQ, setDebouncedWatchlistQ] = useState("");
  const [watchlistMediaType, setWatchlistMediaType] = useState<
    "all" | "movie" | "tv"
  >("all");
  const [watchlistGenreId, setWatchlistGenreId] = useState<number | null>(null);
  const [watchlistSort, setWatchlistSort] = useState<WatchlistSort>("recent");
  const [watchlistPage, setWatchlistPage] = useState(1);
  const manualModal = useOverlayState();
  const avatarModal = useOverlayState();
  const feedbackModal = useOverlayState();

  const inputClassNames: InputClassNames = {
    label: "!text-[#EAD9BC]",
    input: "text-[#F7F1E3] placeholder:text-[#C7B18D]",
    inputWrapper:
      "border-[#E0B15C]/35 bg-[#22130F] focus-within:border-[#E0B15C] focus-within:ring-1 focus-within:ring-[#E0B15C]/60",
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
  const { data: friendRequests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: getFriendRequests,
  });
  const { data: groupInvitations } = useQuery({
    queryKey: ["group-invitations", "incoming"],
    queryFn: () => getGroupInvitations(),
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

  const renderPoster = (
    posterPath?: string | null,
    altText?: string,
    size: "compact" | "row" = "compact",
  ) => {
    const poster = tmdbPosterUrl(posterPath ?? null);
    const dimensions =
      size === "row" ? "h-[7.25rem] w-20" : "h-24 w-16";
    if (poster) {
      return (
        <img
          src={poster}
          alt={altText ?? "Poster"}
          className={`${dimensions} rounded-md object-cover shadow-[0_10px_24px_rgb(0_0_0/0.26)]`}
        />
      );
    }
    return (
      <div className={`flex ${dimensions} items-center justify-center rounded-md border border-[#E0B15C]/25 bg-[#22130F] text-xs app-text-metadata`}>
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
    const metadata = getWatchlistRowMetadata(item);
    return {
      name: metadata.title,
      poster: metadata.poster,
      editorialLine: metadata.editorialLine,
    };
  };

  return (
    <div className="app-page">
      <SkipLink />
      <TopBar
        me={me}
        accountTriggerRef={accountTriggerRef}
        onAvatarClick={avatarModal.open}
        pendingNotificationCount={
          (friendRequests?.incoming.length ?? 0) +
          (groupInvitations?.length ?? 0)
        }
      />

      <div id="main-content" tabIndex={-1} className="app-shell py-7 sm:py-9">
        {groupsLoading ? (
          <div
            className="flex items-center gap-3 app-text-secondary"
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex h-4 w-4 animate-pulse rounded-full bg-[#E0B15C]/40" />
            Loading groups...
          </div>
        ) : groupsError ? (
          <p className="text-sm app-text-destructive" role="alert">
            Unable to load groups. Please refresh.
          </p>
        ) : (
          <div className="space-y-7">
            {groups && groups.length > 0 ? (
              <header className="flex flex-col gap-4 border-b app-rule pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="hidden text-sm font-medium app-text-metadata sm:block">
                  {selectedGroup?.name ?? "Choose a group"}
                </p>
                <h2 className="app-heading-serif mt-1 text-4xl leading-none text-[#F7EAD2] sm:text-5xl">
                  Watchlist
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 app-muted sm:text-base">
                  Add the contenders, invite the group, and start the vote when you’re ready.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <span
                  id="app-group-label"
                  className="text-xs font-semibold uppercase tracking-[0.16em] app-tertiary"
                >
                  Current group
                </span>
                <AppSelect
                  ariaLabel="Current group"
                  placeholder="Select a group"
                  value={resolvedSelectedGroupId}
                  onChange={(value) => value && setSelectedGroupId(value)}
                  isDisabled={!groups || groups.length === 0}
                  className="w-full sm:w-56"
                  options={(groups ?? []).map((group) => ({ id: group.id, label: group.name }))}
                  triggerClassName={theaterSelectClassNames.trigger}
                  valueClassName={theaterSelectClassNames.value}
                  listBoxClassName={theaterSelectClassNames.listbox}
                  popoverClassName={theaterSelectClassNames.popoverContent}
                  indicatorClassName={theaterSelectClassNames.selectorIcon}
                />
              </div>
              </header>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2.45fr)_minmax(18rem,0.75fr)]">
            <main className="flex flex-col gap-5">
              {groups && groups.length === 0 ? (
                <NoGroupsCard inputClassNames={inputClassNames} />
              ) : (
                <>
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
                    onOpenManual={manualModal.open}
                    isManualDisabled={!resolvedSelectedGroupId}
                    inputClassNames={inputClassNames}
                    renderPoster={renderPoster}
                  />
                }
                renderPoster={renderPoster}
                getWatchlistMeta={getWatchlistMeta}
              />
                </>
              )}
            </main>

            <div>
              <RightRail
                friends={friends}
                selectedGroup={selectedGroup}
                currentUserId={me?.id ?? null}
                onOpenAccount={avatarModal.open}
              />
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualAddModal
        isOpen={manualModal.isOpen}
        onOpenChange={manualModal.setOpen}
        selectedGroupId={resolvedSelectedGroupId}
        inputClassNames={inputClassNames}
      />

      {avatarModal.isOpen ? (
        <Suspense
          fallback={<LazyLoadingState label="Opening account…" overlay />}
        >
          <AvatarMenuModal
            isOpen={avatarModal.isOpen}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                avatarModal.open();
                return;
              }
              avatarModal.close();
              window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() =>
                  accountTriggerRef.current?.focus(),
                );
              });
            }}
            me={me}
            groups={groups}
            friends={friends}
            friendRequests={friendRequests}
            groupInvitations={groupInvitations}
            selectedGroup={selectedGroup}
            onGroupCleared={() => setSelectedGroupId(null)}
            onOpenFeedback={
              feedbackAvailability.account
                ? () => {
                    avatarModal.close();
                    window.requestAnimationFrame(feedbackModal.open);
                  }
                : undefined
            }
          />
        </Suspense>
      ) : null}
      {feedbackAvailability.account && feedbackModal.isOpen ? (
        <Suspense
          fallback={<LazyLoadingState label="Opening feedback…" overlay />}
        >
          <FeedbackDialog
            isOpen={feedbackModal.isOpen}
            onOpenChange={feedbackModal.setOpen}
            source="account_profile"
            isAuthenticated
            selectedGroupId={resolvedSelectedGroupId}
            returnFocusRef={accountTriggerRef}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
