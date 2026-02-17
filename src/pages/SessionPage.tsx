/* eslint-disable react-hooks/set-state-in-effect */
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SwipeDeck, {
  type SwipeDeckHandle,
  type SwipeDirection,
} from "../components/SwipeDeck";
import { getMe } from "../features/auth/auth.api";
import { getGroups, type Group } from "../features/groups/groups.api";
import {
  createSession,
  endSession,
  getSessionState,
  shuffleSession,
  submitSessionVote,
  type CreateSessionPayload,
  type SessionCandidate,
  type SessionStateResponse,
} from "../features/sessions/sessions.api";
import { getGroupWatchlistWithOptions } from "../features/watchlist/watchlist.api";
import { tmdbPosterUrl } from "../lib/tmdb";
import {
  playDeckShuffleAnimation,
  revealWinnerAfterShuffle,
  type DeckPhase,
} from "./session/animations";
import "./session/SessionPage.css";

const GROUP_STORAGE_KEY = "arbiter:lastGroupId";
const ACTIVE_SESSION_STORAGE_PREFIX = "arbiter:active-session:";
const CARD_INDEX_STORAGE_PREFIX = "arbiter:session-card-index:";
const SESSION_CONTEXT_STORAGE_PREFIX = "arbiter:session-context:";
const DEAL_SUBMITTED_STORAGE_PREFIX = "arbiter:session-deal-submitted:";
const ROUND_TIMER_SECONDS = 60;
const DEAL_CANDIDATE_COUNT = 8;

type SwipeVote = "yes" | "maybe" | "no";
type VibeInputMode = "tags" | "ai";

type SessionContext = {
  tags: string[];
  moodSummary: string;
  aiWhy: string | null;
};

const TMDB_GENRE_LABEL_BY_ID: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Science Fiction",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  10770: "TV Movie",
};

const TMDB_GENRE_DISPLAY_ORDER = [
  "Action",
  "Adventure",
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Kids",
  "Music",
  "Mystery",
  "News",
  "Reality",
  "Romance",
  "Science Fiction",
  "Sci-Fi & Fantasy",
  "Soap",
  "Talk",
  "TV Movie",
  "Thriller",
  "War",
  "War & Politics",
  "Western",
];

const TMDB_GENRE_SORT_INDEX = Object.fromEntries(
  TMDB_GENRE_DISPLAY_ORDER.map((label, index) => [label, index]),
) as Record<string, number>;

const CANONICAL_GENRE_LABELS: Record<string, string> = {
  "action & adventure": "Action & Adventure",
  "sci-fi & fantasy": "Sci-Fi & Fantasy",
  "science fiction": "Science Fiction",
  "tv movie": "TV Movie",
  "war & politics": "War & Politics",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function toTitleCaseTag(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join(" ");
}

function toDisplayGenreLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return CANONICAL_GENRE_LABELS[normalized] ?? toTitleCaseTag(normalized);
}

function mapDirectionToVote(direction: SwipeDirection): SwipeVote {
  if (direction === "right") return "yes";
  if (direction === "up") return "maybe";
  return "no";
}

function mapVoteToBackend(vote: SwipeVote): "yes" | "no" {
  return vote === "no" ? "no" : "yes";
}

function extractBackendShortlistIds(state: SessionStateResponse | undefined) {
  const shortlist = state?.shortlist;
  if (!Array.isArray(shortlist)) return [];

  const ids = shortlist
    .map((entry) => {
      if (typeof entry === "string") return entry;
      return entry?.watchlist_item_id ?? null;
    })
    .filter((id): id is string => Boolean(id));

  return uniqueStrings(ids);
}

function buildWhyLine(card: SessionCandidate, context: SessionContext) {
  const backendReason = card.reason ?? card.why ?? card.ai_note;
  if (backendReason && backendReason.trim().length > 0) {
    return backendReason.trim();
  }

  const tagLine = context.tags.slice(0, 2).join(" + ");
  if (tagLine) {
    return `Matches: ${tagLine}`;
  }

  if (context.moodSummary.trim()) {
    return `Mood match: ${context.moodSummary.trim().slice(0, 64)}`;
  }

  return "Matches your current vibe";
}

function getReadableVote(vote: SwipeVote | undefined) {
  if (vote === "yes") return "YES";
  if (vote === "maybe") return "MAYBE";
  if (vote === "no") return "NO";
  return "";
}

export default function SessionPage() {
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
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    tags: [],
    moodSummary: "",
    aiWhy: null,
  });
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
    const raw = localStorage.getItem(
      `${DEAL_SUBMITTED_STORAGE_PREFIX}${activeSessionId}`,
    );
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
      const data = query.state.data as SessionStateResponse | undefined;
      if (data?.status !== "active") return false;
      if (data?.phase === "collecting" || data?.phase === "waiting")
        return 1000;
      return 1500;
    },
  });

  useEffect(() => {
    if (!activeSessionId) {
      setSessionContext({ tags: [], moodSummary: "", aiWhy: null });
      return;
    }

    const key = `${SESSION_CONTEXT_STORAGE_PREFIX}${activeSessionId}`;
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      setSessionContext({ tags: [], moodSummary: "", aiWhy: null });
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<SessionContext>;
      setSessionContext({
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        moodSummary:
          typeof parsed.moodSummary === "string" ? parsed.moodSummary : "",
        aiWhy: typeof parsed.aiWhy === "string" ? parsed.aiWhy : null,
      });
    } catch {
      setSessionContext({ tags: [], moodSummary: "", aiWhy: null });
    }
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

    const nextRound = Number.isFinite(state.round)
      ? Math.max(0, Number(state.round))
      : 0;
    const nextPhase =
      typeof state.phase === "string"
        ? state.phase
        : state.status === "complete"
          ? "complete"
          : state.candidates.length > 0
            ? "swiping"
            : "collecting";

    setSessionRound(nextRound);
    setSessionPhase(nextPhase);
    setDeckCards(state.candidates ?? []);
      setSessionStatus(state.status);
      setLeaderEndedSessionNotice(false);

    if (state.result_watchlist_item_id) {
      setWinnerWatchlistItemId(state.result_watchlist_item_id);
    }

    if (state.status === "complete") {
      const completeDeck = [...(state.candidates ?? [])]
        .sort((a, b) => a.position - b.position)
        .reverse();
      const winnerIndex = state.result_watchlist_item_id
        ? completeDeck.findIndex(
            (card) => card.watchlist_item_id === state.result_watchlist_item_id,
          )
        : -1;
      setCurrentIndex(
        winnerIndex >= 0 ? winnerIndex : Math.max(-1, completeDeck.length - 1),
      );
    }
    if (
      nextPhase === "tiebreak" &&
      state.status === "active" &&
      state.candidates.length > 0
    ) {
      setCurrentIndex(state.candidates.length - 1);
    }

    if (previousRoundRef.current !== nextRound && state.status !== "complete") {
      previousRoundRef.current = nextRound;
      processedVotesRef.current = new Set();
      setLocalVotes({});

      const startIndex = Math.max(-1, (state.candidates?.length ?? 0) - 1);
      setCurrentIndex(startIndex);
      if (activeSessionId) {
        localStorage.setItem(
          `${CARD_INDEX_STORAGE_PREFIX}${activeSessionId}:round:${nextRound}`,
          String(startIndex),
        );
      }
    }

    if (
      nextPhase === "swiping" &&
      state.candidates.length > 0 &&
      deckPhase !== "dealing" &&
      deckPhase !== "shuffling" &&
      deckPhase !== "revealingWinner"
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
    const items = Array.isArray(watchlistQuery.data) ? watchlistQuery.data : [];
    const labels = new Set<string>();

    for (const item of items) {
      const title = item.title ?? item.title_info;
      if (!title) continue;

      const genreIds = Array.isArray(title.tmdb_genre_ids)
        ? title.tmdb_genre_ids
        : [];
      const genreNames = Array.isArray(title.tmdb_genres)
        ? title.tmdb_genres
        : [];

      if (genreIds.length > 0) {
        for (const rawId of genreIds) {
          if (typeof rawId !== "number" || !Number.isFinite(rawId)) continue;
          const label = TMDB_GENRE_LABEL_BY_ID[rawId];
          if (label) labels.add(label);
        }
        continue;
      }

      for (const rawGenre of genreNames) {
        if (typeof rawGenre !== "string") continue;
        const label = toDisplayGenreLabel(rawGenre);
        if (label) labels.add(label);
      }
    }

    return Array.from(labels).sort((a, b) => {
      const left = TMDB_GENRE_SORT_INDEX[a] ?? Number.MAX_SAFE_INTEGER;
      const right = TMDB_GENRE_SORT_INDEX[b] ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return a.localeCompare(b);
    });
  }, [watchlistQuery.data]);

  useEffect(() => {
    setSelectedTags((prev) => {
      const next = prev.filter((tag) => availableGenreTags.includes(tag));
      return next.length === prev.length ? prev : next;
    });
  }, [availableGenreTags]);

  const stackCards = useMemo(() => {
    return [...sortedCards].reverse();
  }, [sortedCards]);

  const cardIndexStorageKey = activeSessionId
    ? `${CARD_INDEX_STORAGE_PREFIX}${activeSessionId}:round:${sessionRound}`
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

    if (Number.isFinite(parsedIndex)) {
      if (parsedIndex < 0 && sessionStatus === "complete" && winnerIdNow) {
        const winnerIndex = stackCards.findIndex(
          (card) => card.watchlist_item_id === winnerIdNow,
        );
        if (winnerIndex >= 0) {
          setCurrentIndex(winnerIndex);
          return;
        }
      }
      if (
        parsedIndex < 0 &&
        sessionStatus === "active" &&
        sessionPhase === "swiping" &&
        !userLockedNow
      ) {
        setCurrentIndex(stackCards.length - 1);
        return;
      }
      setCurrentIndex(clamp(parsedIndex, -1, stackCards.length - 1));
      return;
    }

    setCurrentIndex(stackCards.length - 1);
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
      const nextRound =
        typeof response.round === "number" ? Math.max(0, response.round) : 0;

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
          `${SESSION_CONTEXT_STORAGE_PREFIX}${nextSessionId}`,
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
        localStorage.setItem(
          `${DEAL_SUBMITTED_STORAGE_PREFIX}${nextSessionId}`,
          "1",
        );
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
          `${CARD_INDEX_STORAGE_PREFIX}${nextSessionId}:round:${nextRound}`,
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

      queryClient.setQueryData(["session-state", nextSessionId], {
        session_id: response.session_id,
        status: "active",
        phase: nextPhase,
        round: nextRound,
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
      } satisfies SessionStateResponse);
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
        localStorage.removeItem(
          `${DEAL_SUBMITTED_STORAGE_PREFIX}${activeSessionId}`,
        );
      }
      navigate("/app");
    },
  });

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

    const effectiveMode: VibeInputMode =
      vibeInputMode === "tags"
        ? hasTags
          ? "tags"
          : hasMood
            ? "ai"
            : "tags"
        : hasMood
          ? "ai"
          : hasTags
            ? "tags"
            : "ai";

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
      localStorage.removeItem(
        `${DEAL_SUBMITTED_STORAGE_PREFIX}${activeSessionId}`,
      );
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

  const handleProgrammaticSwipe = async (
    direction: "left" | "right" | "up",
  ) => {
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
        setSessionPhase(
          typeof response.phase === "string"
            ? response.phase
            : response.status === "complete"
              ? "complete"
              : "swiping",
        );
        if (typeof response.round === "number") {
          setSessionRound(Math.max(0, response.round));
          previousRoundRef.current = Math.max(0, response.round);
        }
        setDeckCards(response.candidates);
        winnerDeck = [...response.candidates]
          .sort((a, b) => a.position - b.position)
          .reverse();
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

    const winnerIndex = winnerDeck.findIndex(
      (card) => card.watchlist_item_id === winnerId,
    );
    setSessionStatus("complete");
    setCurrentIndex(winnerIndex >= 0 ? winnerIndex : -1);
  };

  const renderPlaceholderDeck = () => {
    return [0, 1, 2, 3, 4].map((idx) => {
      const centerOffset = idx - 2;
      const dealing = deckPhase === "dealing";
      const shuffling =
        deckPhase === "shuffling" || deckPhase === "revealingWinner";

      const baseX = centerOffset * (dealing ? 28 : 18);
      const baseY = centerOffset * 2;
      const baseRotate = centerOffset * (dealing ? 6 : 4);

      const wobbleX = shuffling ? ((shuffleSeed + idx) % 2 === 0 ? 6 : -6) : 0;
      const wobbleRotate = shuffling ? (((shuffleSeed + idx) % 3) - 1) * 3 : 0;

      return (
        <motion.div
          key={`placeholder-${idx}`}
          className={`session-deck-card-size session-placeholder-back absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
            dealing ? "session-placeholder-dealing" : ""
          }`}
          animate={{
            x: baseX + wobbleX,
            y: baseY,
            rotate: baseRotate + wobbleRotate,
            opacity: 0.5 + idx * 0.1,
            scale: 1 - idx * 0.02,
          }}
          transition={{ duration: 0.36, ease: "easeInOut" }}
        />
      );
    });
  };

  const renderWaitingCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="session-deck-card-size session-waiting-card rounded-2xl p-6 text-center">
          <p className="session-title-micro text-xs text-[#D4AF37]/70">
            Session Sync
          </p>
          <h4 className="mt-3 text-xl text-[#F2E2AE]">Waiting for others...</h4>
          <p className="mt-2 text-sm text-[#CFCFCF]">
            Your deck is in. We&apos;ll merge both users&apos; decks once
            everyone clicks Continue.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.12em] text-[#A0A0A0]">
            Waiting For All Confirmations
          </p>
        </div>
      </motion.div>
    );
  };

  const renderTieBreakCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        className="absolute inset-0 z-30 flex items-center justify-center bg-black/30"
      >
        <div className="session-deck-card-size session-waiting-card rounded-2xl p-6 text-center">
          <p className="session-title-micro text-xs text-[#D4AF37]/70">
            Tie-Break
          </p>
          <h4 className="mt-3 text-xl text-[#F2E2AE]">
            No distinct winner yet
          </h4>
          {isGroupLeader ? (
            <p className="mt-2 text-sm text-[#CFCFCF]">
              You&apos;re the group leader. Use shuffle to auto-pick the winner.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#CFCFCF]">
              Waiting for the group leader to run the tie-break shuffle.
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  const renderLeaderEndedCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        className="absolute inset-0 z-30 flex items-center justify-center"
      >
        <div className="session-deck-card-size session-waiting-card rounded-2xl p-6 text-center">
          <p className="session-title-micro text-xs text-[#D4AF37]/70">
            Session Ended
          </p>
          <h4 className="mt-3 text-xl text-[#F2E2AE]">
            Leader has ended the session
          </h4>
          <p className="mt-2 text-sm text-[#CFCFCF]">
            Return to home to start or join a new session.
          </p>
          <Button
            size="sm"
            className="mt-5 border border-[#D4AF37]/55 bg-[#D4AF37] text-[#171717]"
            onPress={() => navigate("/app")}
          >
            Back to Home
          </Button>
        </div>
      </motion.div>
    );
  };

  if (groupsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] text-[#D4AF37]">
        <div className="flex items-center gap-3">
          <Spinner color="warning" size="sm" />
          Loading session setup...
        </div>
      </div>
    );
  }

  if (groupsError || !groups || groups.length === 0) {
    return (
      <div className="min-h-screen bg-[#070707] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-[#7B1E2B]/40 bg-[#0F0F10] p-6">
          <h1 className="text-2xl text-[#D4AF37]">Session unavailable</h1>
          <p className="text-sm text-[#A0A0A0]">
            A group is required before starting a session.
          </p>
          <Button
            className="w-fit border-[#D4AF37]/50 bg-[#D4AF37] text-[#111111]"
            onPress={() => navigate("/app")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-[#070707]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            aria-label="Go to home"
            className="flex items-center gap-3 rounded-lg p-1 text-left transition hover:bg-[#D4AF37]/10"
            onClick={() => navigate("/app")}
          >
            <img
              src="/arbiter.png"
              alt="Arbiter"
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="session-title-micro text-xs text-[#D4AF37]/80">
                Tonight Session
              </p>
              <h1 className="text-lg text-[#D4AF37]">Arbiter</h1>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Select
              size="sm"
              aria-label="Group"
              selectedKeys={resolvedGroupId ? [resolvedGroupId] : []}
              onSelectionChange={(keys) => {
                const [value] = Array.from(keys);
                if (typeof value === "string") {
                  setSelectedGroupId(value);
                }
              }}
              className="min-w-[180px]"
              classNames={{
                trigger:
                  "border-[#D4AF37]/25 bg-[#0F0F10] text-[#D4AF37] data-[focus=true]:border-[#D4AF37]",
                value: "!text-[#D4AF37]",
                popoverContent: "border border-[#D4AF37]/20 bg-[#0F0F10]",
                selectorIcon: "text-[#D4AF37]/80",
              }}
            >
              {groups.map((group) => (
                <SelectItem key={group.id}>{group.name}</SelectItem>
              ))}
            </Select>

            <div className="hidden text-right text-xs text-[#A0A0A0] sm:block">
              <p className="text-white">
                {me?.display_name ?? me?.username ?? "User"}
              </p>
              <p>{me?.email ?? ""}</p>
            </div>

            {isGroupLeader && activeSessionId ? (
              <Button
                size="sm"
                variant="bordered"
                className="border-[#7B1E2B]/45 text-[#E0919B] px-8"
                isLoading={endSessionMutation.isPending}
                onPress={() => {
                  if (!activeSessionId) return;
                  endSessionMutation.mutate(activeSessionId);
                }}
              >
                End Session
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        {!hasSubmittedDeck ? (
          <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
            <CardHeader className="flex flex-col items-start gap-3">
              <div>
                <p className="session-title-micro text-xs text-[#D4AF37]/70">
                  Select a Vibe
                </p>
                <h2 className="text-2xl text-[#F2E2AE]">
                  Curate the mood before the deal
                </h2>
                <p className="mt-1 text-sm text-[#A0A0A0]">
                  Tags are generated from TMDB genres currently in{" "}
                  {selectedGroup?.name ?? "your group"}&apos;s watchlist. Use
                  tags or AI mood text to build the deck.
                </p>
              </div>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={vibeInputMode === "tags" ? "solid" : "bordered"}
                  className={
                    vibeInputMode === "tags"
                      ? "bg-[#D4AF37] text-[#161616]"
                      : "border-[#D4AF37]/35 text-[#D4AF37]"
                  }
                  onPress={() => setVibeInputMode("tags")}
                >
                  Use Tags
                </Button>
                <Button
                  size="sm"
                  variant={vibeInputMode === "ai" ? "solid" : "bordered"}
                  className={
                    vibeInputMode === "ai"
                      ? "bg-[#D4AF37] text-[#161616]"
                      : "border-[#D4AF37]/35 text-[#D4AF37]"
                  }
                  onPress={() => setVibeInputMode("ai")}
                >
                  Use AI Mood
                </Button>
              </div>

              {vibeInputMode === "tags" ? (
                availableGenreTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableGenreTags.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <Button
                          key={tag}
                          size="sm"
                          variant={selected ? "solid" : "bordered"}
                          className={
                            selected
                              ? "bg-[#D4AF37] text-[#161616]"
                              : "border-[#D4AF37]/35 text-[#D4AF37]"
                          }
                          onPress={() => handleToggleTag(tag)}
                        >
                          {tag}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#D4AF37]/20 bg-black/30 p-4">
                    <p className="text-sm text-[#D4AF37]">
                      No TMDB genre tags available yet
                    </p>
                    <p className="mt-1 text-xs text-[#A0A0A0]">
                      Add more TMDB titles to the watchlist, or use AI mood
                      input to infer a genre match.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-[#D4AF37]/20 bg-black/40 p-4">
                  <p className="text-sm text-[#D4AF37]">
                    Arbiter AI Mood Input
                  </p>
                  <p className="mt-1 text-xs text-[#A0A0A0]">
                    Describe your mood. Arbiter uses backend OpenAI parsing to
                    infer tags and build your deck.
                  </p>
                  <Textarea
                    aria-label="Describe your mood"
                    placeholder='Example: "Cozy sci-fi with emotional stakes, nothing too long."'
                    value={aiMoodInput}
                    onValueChange={setAiMoodInput}
                    minRows={3}
                    className="mt-3"
                    classNames={{
                      label: "text-[#D4AF37]/80",
                      input:
                        "!text-[#F5F5F5] placeholder:text-white/35 caret-[#D4AF37]",
                      inputWrapper:
                        "!bg-[#090909] !text-[#F5F5F5] border-[#D4AF37]/20 data-[hover=true]:border-[#D4AF37]/45 data-[focus=true]:!bg-[#090909] data-[focus-visible=true]:!bg-[#090909] data-[focus=true]:border-[#D4AF37]/55",
                    }}
                  />
                </div>
              )}

              {sessionContext.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sessionContext.tags.map((tag) => (
                    <Chip
                      key={tag}
                      variant="bordered"
                      classNames={{
                        base: "border-[#D4AF37]/40",
                        content: "text-[#D4AF37]",
                      }}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs uppercase tracking-[0.1em] text-[#A0A0A0]">
                  {selectedTags.length} selected · {availableGenreTags.length}{" "}
                  available · {sessionContext.tags.length} AI inferred
                </div>
                <Button
                  size="lg"
                  className="session-title-micro border border-[#D4AF37]/50 bg-[#D4AF37] text-[#111111]"
                  isLoading={generateDeckMutation.isPending}
                  isDisabled={
                    !resolvedGroupId ||
                    userLocked ||
                    sessionPhase === "swiping" ||
                    (selectedTags.length === 0 &&
                      aiMoodInput.trim().length === 0)
                  }
                  onPress={handleGenerateDeck}
                >
                  {generateDeckMutation.isPending
                    ? "Submitting"
                    : sessionPhase === "swiping"
                      ? "Deck Ready"
                      : "Deal Your Deck"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <section ref={deckSectionRef} className="space-y-4">
          <div className="flex items-end justify-center">
            <div className="w-full">
              <p className="session-title-micro text-xs text-[#D4AF37]/65 text-left">
                Deck
              </p>
              <h3 className="text-xl text-[#F2E2AE] text-center">
                {showLeaderEndedCard
                  ? "Leader has ended the session."
                  : winnerWatchlistItemId
                  ? "And now… the feature presentation."
                  : sessionPhase === "swiping"
                    ? "Swipe through the shared group deck"
                    : tieBreakRequired
                      ? "Judgment remains divided"
                      : "The stage is set. We await the cast."}
              </h3>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[540px] flex-col items-center gap-4">
            <div className="relative h-[510px] w-full">
              {showPlaceholderDeck ? (
                <div className="absolute inset-0">
                  {renderPlaceholderDeck()}
                </div>
              ) : null}
              {showWaitingCard ? renderWaitingCard() : null}
              {showLeaderEndedCard ? renderLeaderEndedCard() : null}
              {tieBreakRequired ? renderTieBreakCard() : null}
              {stackCards.length > 0 && !showWaitingCard ? (
                <motion.div
                  className="absolute inset-0"
                  animate={
                    deckPhase === "shuffling" || deckPhase === "revealingWinner"
                      ? {
                          x: [0, -8, 8, -6, 6, 0],
                          rotate: [0, -1.3, 1.1, -0.8, 0.8, 0],
                        }
                      : { x: 0, rotate: 0 }
                  }
                  transition={{ duration: 0.72, ease: "easeInOut" }}
                >
                  <SwipeDeck
                    ref={swipeDeckRef}
                    cards={stackCards}
                    getCardId={(card) => card.watchlist_item_id}
                    currentIndex={currentIndex}
                    onCurrentIndexChange={setCurrentIndex}
                    onSwipe={(direction, card) => {
                      handleSwipe(direction, card);
                    }}
                    canSwipe={canSwipe}
                    className="absolute inset-0"
                    renderCard={({ card, index, isTopCard, isVisibleCard }) => {
                      const poster = tmdbPosterUrl(
                        card.title.poster_path,
                        "w780",
                      );
                      const whyLine = buildWhyLine(card, sessionContext);
                      const vote = localVotes[card.watchlist_item_id];
                      const isWinner =
                        winnerWatchlistItemId === card.watchlist_item_id;
                      const mediaType = (card.title.media_type ?? "title")
                        .toString()
                        .toUpperCase();
                      const traceId = card.watchlist_item_id
                        .slice(0, 8)
                        .toUpperCase();

                      return (
                        <article
                          className={`session-deck-card-size session-card-base absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col justify-end rounded-2xl ${
                            isTopCard ? "" : "pointer-events-none"
                          } ${isVisibleCard ? "" : "opacity-0"} ${isWinner ? "session-winner" : ""}`}
                          style={{ zIndex: index + 2 }}
                        >
                          {poster ? (
                            <img
                              src={poster}
                              alt={card.title.name}
                              className="absolute inset-0 h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0C0C0C]" />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                          <div className="session-micro-top-left">
                            <p className="session-micro-code">[{traceId}]</p>
                            <p className="session-micro-kicker">
                              {mediaType} / SD 1.2
                            </p>
                            <div className="session-micro-rule" />
                            <p className="session-micro-code">
                              IDX {String(index + 1).padStart(2, "0")}
                            </p>
                          </div>

                          <div className="relative z-10 p-4">
                            <div className="session-micro-bottom-right">
                              <div className="session-micro-dots" aria-hidden>
                                <span />
                                <span />
                                <span />
                                <span />
                                <span />
                              </div>
                              <p className="session-title-micro text-sm text-[#F2E2AE]">
                                {card.title.name}
                              </p>
                              <p className="session-title-micro text-[10px] text-[#D4AF37]/80">
                                {card.title.release_year ?? "Unknown year"}
                              </p>
                              <p className="session-micro-kicker truncate">
                                {whyLine}
                              </p>
                              {vote ? (
                                <p className="session-title-micro text-[10px] text-[#D4AF37]">
                                  VOTED {getReadableVote(vote)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    }}
                  />
                </motion.div>
              ) : null}
            </div>

            <div className="flex w-full items-center justify-center gap-2">
              <Button
                variant="bordered"
                className="border-[#7B1E2B]/45 text-[#E0919B]"
                isDisabled={!canSwipe}
                onPress={() => {
                  void handleProgrammaticSwipe("left");
                }}
              >
                No
              </Button>
              <Button
                variant="bordered"
                className="border-[#D4AF37]/45 text-[#D4AF37]"
                isDisabled={!canSwipe}
                onPress={() => {
                  void handleProgrammaticSwipe("up");
                }}
              >
                Maybe
              </Button>
              <Button
                className="border border-[#D4AF37]/55 bg-[#D4AF37] text-[#171717]"
                isDisabled={!canSwipe}
                onPress={() => {
                  void handleProgrammaticSwipe("right");
                }}
              >
                Yes
              </Button>
            </div>

            <div className="flex w-full items-center justify-between text-xs text-[#A0A0A0]">
              <div className="flex flex-col">
                <span>
                  {Math.max(0, swipedCount)} / {Math.max(0, totalCards)}
                </span>
                {sessionStatus === "active" ? (
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#D4AF37]/75">
                    {sessionPhase === "swiping"
                      ? `Swipe Timer · ${userSecondsLeft}s`
                      : "Setup · Waiting For Confirmations"}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {showShortlistButton ? (
                  <Button
                    size="sm"
                    variant="bordered"
                    className="border-[#D4AF37]/45 text-[#D4AF37]"
                    onPress={shortlistModal.onOpen}
                  >
                    View Shortlist
                  </Button>
                ) : null}
                {tieBreakRequired && isGroupLeader ? (
                  <Button
                    size="sm"
                    variant="bordered"
                    className="border-[#D4AF37]/45 text-[#D4AF37]"
                    isLoading={
                      shuffleMutation.isPending ||
                      deckPhase === "revealingWinner"
                    }
                    isDisabled={sortedCards.length === 0}
                    onPress={() => {
                      void handleShuffleToDecide();
                    }}
                  >
                    Shuffle Winner
                  </Button>
                ) : null}
              </div>
            </div>

            {isDeckComplete &&
            !showWaitingCard &&
            sessionPhase === "swiping" ? (
              <Card className="w-full border border-[#D4AF37]/25 bg-[#0F0F10]">
                <CardBody className="flex flex-col gap-3">
                  <p className="session-title-micro text-xs text-[#D4AF37]/65">
                    Deck complete
                  </p>
                  <p className="text-sm text-[#E8E8E8]">
                    You reached the end of the shared deck. Review shortlist
                    while the session resolves.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      className="border-[#D4AF37]/45 text-[#D4AF37]"
                      onPress={shortlistModal.onOpen}
                    >
                      Shortlist
                    </Button>
                    <Button
                      size="sm"
                      className="border border-[#D4AF37]/55 bg-[#D4AF37] text-[#171717]"
                      onPress={() => navigate("/app")}
                    >
                      Back to Home
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </section>
      </main>

      <Modal
        isOpen={personalPreviewModal.isOpen}
        onOpenChange={personalPreviewModal.onOpenChange}
        isDismissable={false}
        hideCloseButton
        classNames={{
          base: "border border-[#D4AF37]/25 bg-[#0B0B0B]",
          header: "border-b border-[#D4AF37]/15",
          footer: "border-t border-[#D4AF37]/15",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-[#F0DFA7]">
                Your Dealt Cards
              </ModalHeader>
              <ModalBody>
                {personalPreviewCards.length === 0 ? (
                  <p className="text-sm text-[#A0A0A0]">
                    No cards selected yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {personalPreviewCards.map((card) => {
                      const poster = tmdbPosterUrl(
                        card.title.poster_path,
                        "w342",
                      );
                      return (
                        <div
                          key={`preview-${card.watchlist_item_id}`}
                          className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-black/35 p-2"
                        >
                          {poster ? (
                            <img
                              src={poster}
                              alt={card.title.name}
                              className="h-14 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-10 items-center justify-center rounded-md border border-[#D4AF37]/20 text-[10px] text-[#A0A0A0]">
                              N/A
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">
                              {card.title.name}
                            </p>
                            <p className="text-xs text-[#A0A0A0]">
                              {card.title.release_year ?? "Unknown year"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="bordered"
                  className="border-[#D4AF37]/35 text-[#D4AF37]"
                  isDisabled={generateDeckMutation.isPending}
                  onPress={handleBackToVibeSelection}
                >
                  Back
                </Button>
                <Button
                  className="border border-[#D4AF37]/55 bg-[#D4AF37] text-[#171717]"
                  isLoading={generateDeckMutation.isPending}
                  onPress={handleConfirmDeal}
                >
                  Continue
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={shortlistModal.isOpen}
        onOpenChange={shortlistModal.onOpenChange}
        classNames={{
          base: "border border-[#D4AF37]/25 bg-[#0B0B0B]",
          header: "border-b border-[#D4AF37]/15",
          footer: "border-t border-[#D4AF37]/15",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-[#F0DFA7]">Shortlist</ModalHeader>
              <ModalBody>
                {shortlist.length === 0 ? (
                  <p className="text-sm text-[#A0A0A0]">
                    No shortlist yet. Swipe yes/maybe or finish the deck.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {shortlist.map((card) => {
                      const poster = tmdbPosterUrl(
                        card.title.poster_path,
                        "w342",
                      );
                      const vote = localVotes[card.watchlist_item_id];
                      const isWinner =
                        winnerWatchlistItemId === card.watchlist_item_id;

                      return (
                        <div
                          key={card.watchlist_item_id}
                          className={`flex items-center gap-3 rounded-xl border p-2 ${
                            isWinner
                              ? "border-[#D4AF37]/80 bg-[#D4AF37]/10"
                              : "border-[#D4AF37]/20 bg-black/35"
                          }`}
                        >
                          {poster ? (
                            <img
                              src={poster}
                              alt={card.title.name}
                              className="h-14 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-10 items-center justify-center rounded-md border border-[#D4AF37]/20 text-[10px] text-[#A0A0A0]">
                              N/A
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">
                              {card.title.name}
                            </p>
                            <p className="text-xs text-[#A0A0A0]">
                              {card.title.release_year ?? "Unknown year"}
                            </p>
                          </div>
                          {isWinner ? (
                            <Chip
                              size="sm"
                              variant="flat"
                              classNames={{
                                base: "bg-[#D4AF37]/20",
                                content: "text-[#F4DE9E]",
                              }}
                            >
                              Winner
                            </Chip>
                          ) : vote ? (
                            <Chip
                              size="sm"
                              variant="bordered"
                              classNames={{
                                base: "border-[#D4AF37]/40",
                                content: "text-[#D4AF37]",
                              }}
                            >
                              {getReadableVote(vote)}
                            </Chip>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="bordered"
                  className="border-[#D4AF37]/35 text-[#D4AF37]"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
