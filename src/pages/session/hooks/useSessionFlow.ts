import { useDisclosure } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SwipeDeckHandle, SwipeDirection } from "../../../components/SwipeDeck";
import { getMe } from "../../../features/auth/auth.api";
import { getGroups, type Group } from "../../../features/groups/groups.api";
import {
  createSession,
  endSession,
  getSessionState,
  setSessionWatchPartyLink,
  shuffleSession,
  submitSessionVote,
  type CreateSessionPayload,
  type SessionCandidate,
  type SessionStateResponse,
} from "../../../features/sessions/sessions.api";
import {
  getGroupWatchlistWithOptions,
  type WatchlistItem,
} from "../../../features/watchlist/watchlist.api";
import {
  playDeckShuffleAnimation,
  revealWinnerAfterShuffle,
  type DeckPhase,
} from "../animations";
import {
  ACTIVE_SESSION_STORAGE_PREFIX,
  CARD_INDEX_STORAGE_PREFIX,
  DEAL_CANDIDATE_COUNT,
  DEAL_SUBMITTED_STORAGE_PREFIX,
  GROUP_STORAGE_KEY,
  ROUND_TIMER_SECONDS,
  SESSION_CONTEXT_STORAGE_PREFIX,
} from "../constants";
import type { SessionContext, SwipeVote, VibeInputMode } from "../types";
import {
  clamp,
  deriveAvailableGenreTags,
  extractBackendShortlistIds,
  getReadableVote,
  mapDirectionToVote,
  mapVoteToBackend,
  toDisplayGenreLabel,
  uniqueStrings,
} from "../utils";

function getMutationErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const maybeMessage = "message" in error ? error.message : null;
  if (typeof maybeMessage === "string" && maybeMessage.trim()) {
    return maybeMessage.trim();
  }
  return null;
}

function createEmptySessionContext(): SessionContext {
  return { tags: [], moodSummary: "", aiWhy: null };
}

function getSessionContextStorageKey(sessionId: string): string {
  return `${SESSION_CONTEXT_STORAGE_PREFIX}${sessionId}`;
}

function getDealSubmittedStorageKey(sessionId: string): string {
  return `${DEAL_SUBMITTED_STORAGE_PREFIX}${sessionId}`;
}

function getRoundCardIndexStorageKey(sessionId: string, round: number): string {
  return `${CARD_INDEX_STORAGE_PREFIX}${sessionId}:round:${round}`;
}

function normalizeSessionRound(round: unknown): number {
  return typeof round === "number" && Number.isFinite(round)
    ? Math.max(0, round)
    : 0;
}

function deriveSessionPhase(state: SessionStateResponse): string {
  if (typeof state.phase === "string") return state.phase;
  if (state.status === "complete") return "complete";
  return state.candidates.length > 0 ? "swiping" : "collecting";
}

function getSessionRefetchInterval(
  data: SessionStateResponse | undefined,
): number | false {
  if (data?.status === "complete") {
    const hasWinner = Boolean(data.result_watchlist_item_id);
    const hasWatchPartyUrl =
      typeof data.watch_party_url === "string" &&
      data.watch_party_url.trim().length > 0;
    // Keep polling after a winner so non-leaders pick up the shared Teleparty URL.
    if (hasWinner && !hasWatchPartyUrl && !data.ended_by_leader) return 2000;
    return false;
  }
  if (data?.status !== "active") return false;
  if (data?.phase === "collecting" || data?.phase === "waiting") return 1000;
  return 1500;
}

function isDeckAnimating(deckPhase: DeckPhase): boolean {
  return deckPhase === "dealing" || deckPhase === "shuffling" || deckPhase === "revealingWinner";
}

function buildStackCards(candidates: SessionCandidate[]): SessionCandidate[] {
  return [...candidates].sort((a, b) => a.position - b.position).reverse();
}

function findWinnerIndex(
  cards: SessionCandidate[],
  winnerId: string | null | undefined,
): number {
  if (!winnerId) return -1;
  return cards.findIndex((card) => card.watchlist_item_id === winnerId);
}

function normalizeWatchPartyUrl(url: string | null | undefined): string | null {
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}

function readSessionContext(sessionId: string | null): SessionContext {
  if (!sessionId) return createEmptySessionContext();
  const rawValue = localStorage.getItem(getSessionContextStorageKey(sessionId));
  if (!rawValue) return createEmptySessionContext();

  try {
    const parsed = JSON.parse(rawValue) as Partial<SessionContext>;
    return {
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      moodSummary:
        typeof parsed.moodSummary === "string" ? parsed.moodSummary : "",
      aiWhy: typeof parsed.aiWhy === "string" ? parsed.aiWhy : null,
    };
  } catch {
    return createEmptySessionContext();
  }
}

function resolveRestoredCardIndex({
  storedIndex,
  cards,
  sessionStatus,
  sessionPhase,
  userLocked,
  winnerId,
}: {
  storedIndex: number | null;
  cards: SessionCandidate[];
  sessionStatus: string;
  sessionPhase: string;
  userLocked: boolean;
  winnerId: string | null;
}): number {
  if (cards.length === 0) return -1;

  if (storedIndex !== null) {
    if (storedIndex < 0 && sessionStatus === "complete" && winnerId) {
      const winnerIndex = findWinnerIndex(cards, winnerId);
      if (winnerIndex >= 0) return winnerIndex;
    }
    if (
      storedIndex < 0 &&
      sessionStatus === "active" &&
      sessionPhase === "swiping" &&
      !userLocked
    ) {
      return cards.length - 1;
    }
    return clamp(storedIndex, -1, cards.length - 1);
  }

  return cards.length - 1;
}

function resolveEffectiveVibeInputMode({
  requestedMode,
  hasTags,
  hasMood,
}: {
  requestedMode: VibeInputMode;
  hasTags: boolean;
  hasMood: boolean;
}): VibeInputMode {
  if (requestedMode === "tags") {
    if (hasTags) return "tags";
    if (hasMood) return "ai";
    return "tags";
  }
  if (hasMood) return "ai";
  if (hasTags) return "tags";
  return "ai";
}

function buildSessionStateCacheFromCreateResponse({
  response,
  phase,
  round,
}: {
  response: Awaited<ReturnType<typeof createSession>>;
  phase: string;
  round: number;
}): SessionStateResponse {
  return {
    session_id: response.session_id,
    status: "active",
    phase,
    round,
    user_locked: Boolean(response.user_locked),
    user_seconds_left:
      typeof response.user_seconds_left === "number"
        ? response.user_seconds_left
        : ROUND_TIMER_SECONDS,
    tie_break_required: Boolean(response.tie_break_required),
    tie_break_candidate_ids: response.tie_break_candidate_ids ?? [],
    ends_at: response.ends_at,
    completed_at: null,
    result_watchlist_item_id: null,
    mutual_candidate_ids: [],
    shortlist: [],
    candidates: response.candidates,
  };
}

export function useSessionFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const shortlistModal = useDisclosure();
  const personalPreviewModal = useDisclosure();

  const requestedGroupId = searchParams.get("groupId");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    return requestedGroupId ?? localStorage.getItem(GROUP_STORAGE_KEY);
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiMoodInput, setAiMoodInput] = useState("");
  const [vibeInputMode, setVibeInputMode] = useState<VibeInputMode>("tags");

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<SessionCandidate[]>([]);
  const [deckPhase, setDeckPhase] = useState<DeckPhase>("idle");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<string>("active");
  const [sessionPhase, setSessionPhase] = useState<string>("collecting");
  const [sessionRound, setSessionRound] = useState<number>(0);
  const [leaderEndedSessionNotice, setLeaderEndedSessionNotice] =
    useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [winnerWatchlistItemId, setWinnerWatchlistItemId] = useState<
    string | null
  >(null);
  const [localVotes, setLocalVotes] = useState<Record<string, SwipeVote>>({});
  const [sessionContext, setSessionContext] = useState<SessionContext>(
    () => createEmptySessionContext(),
  );
  const [personalPreviewCards, setPersonalPreviewCards] = useState<
    SessionCandidate[]
  >([]);
  const [hasSubmittedDeck, setHasSubmittedDeck] = useState(false);

  const processedVotesRef = useRef<Set<string>>(new Set());
  const previousRoundRef = useRef<number>(0);
  const joinAttemptRef = useRef<string | null>(null);
  const deckSectionRef = useRef<HTMLDivElement | null>(null);
  const swipeDeckRef = useRef<SwipeDeckHandle | null>(null);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const {
    data: groups,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useQuery({ queryKey: ["groups"], queryFn: getGroups });

  const resolvedGroupId = useMemo(() => {
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

  const watchlistQuery = useQuery({
    queryKey: ["session-watchlist", resolvedGroupId],
    queryFn: () =>
      getGroupWatchlistWithOptions(resolvedGroupId ?? "", { tonight: true }),
    enabled: Boolean(resolvedGroupId),
    staleTime: 30_000,
  });

  const selectedGroup = useMemo<Group | null>(() => {
    return groups?.find((group) => group.id === resolvedGroupId) ?? null;
  }, [groups, resolvedGroupId]);

  const activeSessionStorageKey = resolvedGroupId
    ? `${ACTIVE_SESSION_STORAGE_PREFIX}${resolvedGroupId}`
    : null;

  useEffect(() => {
    if (requestedGroupId && requestedGroupId !== selectedGroupId) {
      setSelectedGroupId(requestedGroupId);
    }
  }, [requestedGroupId, selectedGroupId]);

  useEffect(() => {
    if (!resolvedGroupId) return;

    localStorage.setItem(GROUP_STORAGE_KEY, resolvedGroupId);

    const params = new URLSearchParams(searchParams);
    if (params.get("groupId") !== resolvedGroupId) {
      params.set("groupId", resolvedGroupId);
      setSearchParams(params, { replace: true });
    }
  }, [resolvedGroupId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!activeSessionStorageKey) {
      setActiveSessionId(null);
      return;
    }

    const stored = localStorage.getItem(activeSessionStorageKey);
    setActiveSessionId(stored);
  }, [activeSessionStorageKey]);

  useEffect(() => {
    if (!activeSessionId) {
      setHasSubmittedDeck(false);
      return;
    }
    const raw = localStorage.getItem(getDealSubmittedStorageKey(activeSessionId));
    setHasSubmittedDeck(raw === "1");
  }, [activeSessionId]);

  useEffect(() => {
    joinAttemptRef.current = null;
    setLeaderEndedSessionNotice(false);
  }, [resolvedGroupId]);

  useEffect(() => {
    if (activeSessionId) return;
    setSessionRound(0);
    setSessionPhase("collecting");
    previousRoundRef.current = 0;
  }, [activeSessionId]);

  const sessionStateQuery = useQuery({
    queryKey: ["session-state", activeSessionId],
    queryFn: () => getSessionState(activeSessionId ?? ""),
    enabled: Boolean(activeSessionId),
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      return getSessionRefetchInterval(
        query.state.data as SessionStateResponse | undefined,
      );
    },
  });

  useEffect(() => {
    setSessionContext(readSessionContext(activeSessionId));
  }, [activeSessionId]);

  useEffect(() => {
    const state = sessionStateQuery.data;
    if (!state) return;
    if (
      state.status === "complete" &&
      activeSessionStorageKey &&
      activeSessionId &&
      state.ended_by_leader
    ) {
      setLeaderEndedSessionNotice(true);
      setSessionStatus("complete");
      setSessionPhase("ended_by_leader");
      setDeckCards([]);
      setCurrentIndex(-1);
      setDeckPhase("idle");
      localStorage.removeItem(activeSessionStorageKey);
      setActiveSessionId(null);
      return;
    }

    const nextRound = normalizeSessionRound(state.round);
    const nextPhase = deriveSessionPhase(state);
    const nextCandidates = state.candidates ?? [];

    setSessionRound(nextRound);
    setSessionPhase(nextPhase);
    setDeckCards(nextCandidates);
    setSessionStatus(state.status);
    setLeaderEndedSessionNotice(false);

    if (state.result_watchlist_item_id) {
      setWinnerWatchlistItemId(state.result_watchlist_item_id);
    }

    if (state.status === "complete") {
      const completeDeck = buildStackCards(nextCandidates);
      const winnerIndex = findWinnerIndex(
        completeDeck,
        state.result_watchlist_item_id,
      );
      setCurrentIndex(
        winnerIndex >= 0 ? winnerIndex : Math.max(-1, completeDeck.length - 1),
      );
    }
    if (
      nextPhase === "tiebreak" &&
      state.status === "active" &&
      nextCandidates.length > 0
    ) {
      setCurrentIndex(nextCandidates.length - 1);
    }

    if (previousRoundRef.current !== nextRound && state.status !== "complete") {
      previousRoundRef.current = nextRound;
      processedVotesRef.current = new Set();
      setLocalVotes({});

      const startIndex = Math.max(-1, nextCandidates.length - 1);
      setCurrentIndex(startIndex);
      if (activeSessionId) {
        localStorage.setItem(
          getRoundCardIndexStorageKey(activeSessionId, nextRound),
          String(startIndex),
        );
      }
    }

    if (
      nextPhase === "swiping" &&
      nextCandidates.length > 0 &&
      !isDeckAnimating(deckPhase)
    ) {
      setDeckPhase("ready");
    } else if (nextPhase !== "swiping") {
      setDeckPhase("idle");
    }
  }, [
    sessionStateQuery.data,
    deckPhase,
    activeSessionId,
    activeSessionStorageKey,
  ]);

  const sortedCards = useMemo(() => {
    return [...deckCards].sort((a, b) => a.position - b.position);
  }, [deckCards]);

  const availableGenreTags = useMemo(() => {
    const items = Array.isArray(watchlistQuery.data)
      ? (watchlistQuery.data as WatchlistItem[])
      : [];
    return deriveAvailableGenreTags(items);
  }, [watchlistQuery.data]);

  useEffect(() => {
    setSelectedTags((prev) => {
      const next = prev.filter((tag) => availableGenreTags.includes(tag));
      return next.length === prev.length ? prev : next;
    });
  }, [availableGenreTags]);

  const stackCards = useMemo(() => {
    return buildStackCards(sortedCards);
  }, [sortedCards]);

  const cardIndexStorageKey = activeSessionId
    ? getRoundCardIndexStorageKey(activeSessionId, sessionRound)
    : null;

  useEffect(() => {
    if (!cardIndexStorageKey) {
      setCurrentIndex(-1);
      return;
    }

    if (stackCards.length === 0) {
      setCurrentIndex(-1);
      return;
    }

    const rawValue = localStorage.getItem(cardIndexStorageKey);
    const parsedIndex = Number.parseInt(rawValue ?? "", 10);
    const userLockedNow = Boolean(sessionStateQuery.data?.user_locked);
    const winnerIdNow =
      sessionStateQuery.data?.result_watchlist_item_id ?? winnerWatchlistItemId;
    const restoredIndex = resolveRestoredCardIndex({
      storedIndex: Number.isFinite(parsedIndex) ? parsedIndex : null,
      cards: stackCards,
      sessionStatus,
      sessionPhase,
      userLocked: userLockedNow,
      winnerId: winnerIdNow,
    });
    setCurrentIndex(restoredIndex);
  }, [
    cardIndexStorageKey,
    stackCards,
    stackCards.length,
    sessionPhase,
    sessionStatus,
    sessionStateQuery.data?.user_locked,
    sessionStateQuery.data?.result_watchlist_item_id,
    winnerWatchlistItemId,
  ]);

  useEffect(() => {
    if (!cardIndexStorageKey) return;
    if (stackCards.length === 0) return;
    localStorage.setItem(cardIndexStorageKey, String(currentIndex));
  }, [cardIndexStorageKey, currentIndex, stackCards.length]);

  const voteMutation = useMutation({
    mutationFn: ({
      sessionId,
      watchlistItemId,
      vote,
    }: {
      sessionId: string;
      watchlistItemId: string;
      vote: SwipeVote;
    }) =>
      submitSessionVote(sessionId, {
        watchlist_item_id: watchlistItemId,
        vote: mapVoteToBackend(vote),
      }),
    onError: () => {
      if (!activeSessionId) return;
      void queryClient.invalidateQueries({
        queryKey: ["session-state", activeSessionId],
      });
    },
  });

  const generateDeckMutation = useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: string;
      payload: CreateSessionPayload;
      intent: "join" | "deal" | "confirm";
    }) => createSession(groupId, payload),
    onSuccess: async (response, variables) => {
      const nextSessionId = response.session_id;
      const nextPhase =
        typeof response.phase === "string" ? response.phase : "collecting";
      const nextRound = normalizeSessionRound(response.round);

      if (activeSessionId && activeSessionId !== nextSessionId) {
        setLocalVotes({});
        processedVotesRef.current = new Set();
        setWinnerWatchlistItemId(null);
      }

      setActiveSessionId(nextSessionId);
      if (activeSessionStorageKey) {
        localStorage.setItem(activeSessionStorageKey, nextSessionId);
      }

      if (variables.intent === "deal") {
        const inferredTags = Array.isArray(response.constraints?.moods)
          ? response.constraints.moods
              .filter(
                (mood): mood is string =>
                  typeof mood === "string" && mood.trim().length > 0,
              )
              .map((mood) => toDisplayGenreLabel(mood))
          : [];
        const manualTagsUsed = vibeInputMode === "tags" ? selectedTags : [];
        const context: SessionContext = {
          tags: uniqueStrings([...manualTagsUsed, ...inferredTags]),
          moodSummary: vibeInputMode === "ai" ? aiMoodInput.trim() : "",
          aiWhy: response.ai_why,
        };
        localStorage.setItem(
          getSessionContextStorageKey(nextSessionId),
          JSON.stringify(context),
        );
        setSessionContext(context);

        const previewCards =
          response.personal_candidates &&
          response.personal_candidates.length > 0
            ? response.personal_candidates
            : (response.candidates ?? []);
        setPersonalPreviewCards(previewCards);
        if (previewCards.length > 0) {
          personalPreviewModal.onOpen();
        }
        setHasSubmittedDeck(true);
        localStorage.setItem(getDealSubmittedStorageKey(nextSessionId), "1");
      }

      setDeckCards(response.candidates ?? []);
      setSessionStatus("active");
      setSessionPhase(nextPhase);
      setSessionRound(nextRound);
      previousRoundRef.current = nextRound;

      if (nextPhase === "swiping" && (response.candidates?.length ?? 0) > 0) {
        const startIndex = (response.candidates?.length ?? 0) - 1;
        setCurrentIndex(startIndex);
        localStorage.setItem(
          getRoundCardIndexStorageKey(nextSessionId, nextRound),
          String(startIndex),
        );
        await playDeckShuffleAnimation({
          setDeckPhase,
          setShuffleSeed,
          phase: "shuffling",
        });
        setDeckPhase("ready");
      } else {
        setCurrentIndex(-1);
        setDeckPhase("idle");
      }

      queryClient.setQueryData(
        ["session-state", nextSessionId],
        buildSessionStateCacheFromCreateResponse({
          response,
          phase: nextPhase,
          round: nextRound,
        }),
      );
    },
    onError: () => {
      setDeckPhase("idle");
    },
  });

  useEffect(() => {
    if (!resolvedGroupId) return;
    if (leaderEndedSessionNotice) return;
    if (activeSessionId) return;
    if (generateDeckMutation.isPending) return;
    if (joinAttemptRef.current === resolvedGroupId) return;

    joinAttemptRef.current = resolvedGroupId;
    generateDeckMutation.mutate({
      groupId: resolvedGroupId,
      intent: "join",
      payload: {
        constraints: {},
        confirm_ready: false,
        duration_seconds: ROUND_TIMER_SECONDS,
        candidate_count: DEAL_CANDIDATE_COUNT,
      },
    });
  }, [
    activeSessionId,
    generateDeckMutation,
    leaderEndedSessionNotice,
    resolvedGroupId,
  ]);

  const shuffleMutation = useMutation({
    mutationFn: (sessionId: string) => shuffleSession(sessionId),
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      if (activeSessionStorageKey) {
        localStorage.removeItem(activeSessionStorageKey);
      }
      if (activeSessionId) {
        queryClient.removeQueries({
          queryKey: ["session-state", activeSessionId],
        });
      }
      setActiveSessionId(null);
      setDeckCards([]);
      setCurrentIndex(-1);
      setSessionStatus("active");
      setSessionPhase("collecting");
      setSessionRound(0);
      setWinnerWatchlistItemId(null);
      setDeckPhase("idle");
      setLocalVotes({});
      processedVotesRef.current = new Set();
      joinAttemptRef.current = null;
      if (activeSessionId) {
        localStorage.removeItem(getDealSubmittedStorageKey(activeSessionId));
      }
      navigate("/app");
    },
  });

  const watchPartyMutation = useMutation({
    mutationFn: ({
      sessionId,
      url,
    }: {
      sessionId: string;
      url: string | null;
    }) => setSessionWatchPartyLink(sessionId, { url }),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(["session-state", variables.sessionId], response);
    },
  });
  const watchPartyError =
    watchPartyMutation.isError
      ? getMutationErrorMessage(watchPartyMutation.error) ??
        "Unable to save Teleparty link."
      : null;

  const totalCards = stackCards.length;
  const swipedCount = totalCards > 0 ? totalCards - currentIndex - 1 : 0;
  const isDeckComplete = totalCards > 0 && currentIndex < 0;
  const hasVotes = Object.keys(localVotes).length > 0;
  const isGroupLeader = Boolean(
    me?.id && selectedGroup?.owner_id && me.id === selectedGroup.owner_id,
  );
  const tieBreakRequired =
    sessionStatus === "active" &&
    (sessionPhase === "tiebreak" ||
      Boolean(sessionStateQuery.data?.tie_break_required));
  const watchPartyUrl =
    normalizeWatchPartyUrl(sessionStateQuery.data?.watch_party_url);
  const userLocked = Boolean(sessionStateQuery.data?.user_locked);
  const userSecondsLeft =
    typeof sessionStateQuery.data?.user_seconds_left === "number"
      ? Math.max(0, sessionStateQuery.data.user_seconds_left)
      : ROUND_TIMER_SECONDS;
  const showWaitingCard =
    sessionStatus === "active" &&
    !tieBreakRequired &&
    (sessionPhase === "waiting" || sessionPhase === "collecting");
  const showLeaderEndedCard = leaderEndedSessionNotice;
  const canSwipe =
    sessionPhase === "swiping" &&
    deckPhase === "ready" &&
    currentIndex >= 0 &&
    sessionStatus !== "complete" &&
    !userLocked &&
    !showWaitingCard &&
    !shuffleMutation.isPending;
  const showPlaceholderDeck =
    !showWaitingCard &&
    !tieBreakRequired &&
    sessionStatus !== "complete" &&
    (stackCards.length === 0 || currentIndex < 0);

  const shortlistByBackendIds = useMemo(
    () => extractBackendShortlistIds(sessionStateQuery.data),
    [sessionStateQuery.data],
  );

  const shortlist = useMemo(() => {
    const cardsById = new Map(
      sortedCards.map((card) => [card.watchlist_item_id, card]),
    );

    if (shortlistByBackendIds.length > 0) {
      return shortlistByBackendIds
        .map((id) => cardsById.get(id))
        .filter((card): card is SessionCandidate => Boolean(card));
    }

    const yesCards = sortedCards.filter(
      (card) => localVotes[card.watchlist_item_id] === "yes",
    );
    const maybeCards = sortedCards.filter(
      (card) => localVotes[card.watchlist_item_id] === "maybe",
    );

    const combined = uniqueStrings(
      [...yesCards, ...maybeCards].map((card) => card.watchlist_item_id),
    )
      .map((id) => cardsById.get(id))
      .filter((card): card is SessionCandidate => Boolean(card));

    if (combined.length > 0) return combined;

    if (winnerWatchlistItemId && cardsById.has(winnerWatchlistItemId)) {
      const winnerCard = cardsById.get(winnerWatchlistItemId);
      return winnerCard ? [winnerCard] : [];
    }

    return [];
  }, [localVotes, shortlistByBackendIds, sortedCards, winnerWatchlistItemId]);

  const showShortlistButton =
    hasVotes || isDeckComplete || shortlist.length > 0;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((value) => value !== tag);
      }
      return [...prev, tag];
    });
  };

  const handleGenerateDeck = () => {
    if (!resolvedGroupId || generateDeckMutation.isPending) return;
    const mood = aiMoodInput.trim();
    const tags = uniqueStrings(selectedTags);
    const hasTags = tags.length > 0;
    const hasMood = mood.length > 0;
    if (!hasTags && !hasMood) return;

    const effectiveMode = resolveEffectiveVibeInputMode({
      requestedMode: vibeInputMode,
      hasTags,
      hasMood,
    });

    setDeckPhase("dealing");
    deckSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    generateDeckMutation.mutate({
      groupId: resolvedGroupId,
      intent: "deal",
      payload: {
        constraints: effectiveMode === "tags" ? { moods: tags } : {},
        text: effectiveMode === "ai" ? mood : undefined,
        confirm_ready: false,
        duration_seconds: ROUND_TIMER_SECONDS,
        candidate_count: DEAL_CANDIDATE_COUNT,
      },
    });
  };

  const handleConfirmDeal = () => {
    if (!resolvedGroupId || generateDeckMutation.isPending) return;
    generateDeckMutation.mutate({
      groupId: resolvedGroupId,
      intent: "confirm",
      payload: {
        constraints: {},
        confirm_ready: true,
        duration_seconds: ROUND_TIMER_SECONDS,
        candidate_count: DEAL_CANDIDATE_COUNT,
      },
    });
    personalPreviewModal.onClose();
  };

  const handleBackToVibeSelection = () => {
    if (generateDeckMutation.isPending) return;
    if (activeSessionId) {
      localStorage.removeItem(getDealSubmittedStorageKey(activeSessionId));
    }
    setHasSubmittedDeck(false);
    personalPreviewModal.onClose();
  };

  const handleSwipe = (direction: SwipeDirection, card: SessionCandidate) => {
    const vote = mapDirectionToVote(direction);
    const voteKey = `${sessionRound}:${card.watchlist_item_id}`;

    if (processedVotesRef.current.has(voteKey)) {
      return;
    }

    processedVotesRef.current.add(voteKey);
    setLocalVotes((prev) => ({ ...prev, [card.watchlist_item_id]: vote }));

    if (activeSessionId) {
      voteMutation.mutate({
        sessionId: activeSessionId,
        watchlistItemId: card.watchlist_item_id,
        vote,
      });
    }
  };

  const handleProgrammaticSwipe = async (direction: "left" | "right" | "up") => {
    if (!canSwipe || currentIndex < 0) return;
    await swipeDeckRef.current?.swipe(direction);
  };

  const handleShuffleToDecide = async () => {
    if (sortedCards.length === 0 || deckPhase === "revealingWinner") return;
    if (!tieBreakRequired || !isGroupLeader) return;

    let winnerId: string | null = winnerWatchlistItemId;
    let winnerDeck = stackCards;

    if (activeSessionId && sessionStatus === "active") {
      try {
        const response = await shuffleMutation.mutateAsync(activeSessionId);
        queryClient.setQueryData(["session-state", activeSessionId], response);
        setSessionStatus(response.status);
        setSessionPhase(deriveSessionPhase(response));
        const nextRound = normalizeSessionRound(response.round);
        setSessionRound(nextRound);
        previousRoundRef.current = nextRound;
        setDeckCards(response.candidates);
        winnerDeck = buildStackCards(response.candidates);
        winnerId = response.result_watchlist_item_id;
      } catch {
        winnerId = null;
      }
    }

    if (!winnerId) return;

    await revealWinnerAfterShuffle({
      winnerWatchlistItemId: winnerId,
      setDeckPhase,
      setShuffleSeed,
      setWinnerWatchlistItemId,
    });

    const winnerIndex = findWinnerIndex(winnerDeck, winnerId);
    setSessionStatus("complete");
    setCurrentIndex(winnerIndex >= 0 ? winnerIndex : -1);
  };

  const handleSetWatchPartyUrl = async (url: string | null) => {
    if (!activeSessionId || watchPartyMutation.isPending) return;
    const normalized = normalizeWatchPartyUrl(url);
    watchPartyMutation.reset();
    try {
      await watchPartyMutation.mutateAsync({
        sessionId: activeSessionId,
        url: normalized,
      });
    } catch {
      // Mutation state carries the API error; avoid unhandled promise rejection.
    }
  };

  return {
    groups,
    groupsLoading,
    groupsError,
    me,
    selectedGroup,
    resolvedGroupId,
    setSelectedGroupId,

    isGroupLeader,
    activeSessionId,
    endSessionMutation,
    generateDeckMutation,
    shuffleMutation,

    hasSubmittedDeck,
    vibeInputMode,
    setVibeInputMode,
    availableGenreTags,
    selectedTags,
    aiMoodInput,
    setAiMoodInput,
    sessionContext,

    userLocked,
    sessionPhase,

    deckSectionRef,
    swipeDeckRef,

    sessionStatus,
    winnerWatchlistItemId,
    tieBreakRequired,
    watchPartyUrl,
    watchPartyError,
    showLeaderEndedCard,
    showPlaceholderDeck,
    showWaitingCard,
    stackCards,
    deckPhase,
    shuffleSeed,
    currentIndex,
    setCurrentIndex,
    canSwipe,
    localVotes,
    swipedCount,
    totalCards,
    userSecondsLeft,
    showShortlistButton,
    sortedCards,
    isDeckComplete,

    shortlist,
    shortlistModal,
    personalPreviewModal,
    personalPreviewCards,

    handleToggleTag,
    handleGenerateDeck,
    handleConfirmDeal,
    handleBackToVibeSelection,
    handleSwipe,
    handleProgrammaticSwipe,
    handleShuffleToDecide,
    handleSetWatchPartyUrl,
    watchPartyMutation,
    goHome: () => navigate("/app"),
    handleEndSession: () => {
      if (!activeSessionId) return;
      endSessionMutation.mutate(activeSessionId);
    },
    getReadableVote,
  };
}
