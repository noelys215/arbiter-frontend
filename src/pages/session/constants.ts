export const GROUP_STORAGE_KEY = "arbiter:lastGroupId";
export const ACTIVE_SESSION_STORAGE_PREFIX = "arbiter:active-session:";
export const CARD_INDEX_STORAGE_PREFIX = "arbiter:session-card-index:";
export const SESSION_CONTEXT_STORAGE_PREFIX = "arbiter:session-context:";
export const DEAL_SUBMITTED_STORAGE_PREFIX = "arbiter:session-deal-submitted:";
export const ROUND_TIMER_SECONDS = 60;
export const DEAL_CANDIDATE_COUNT = 8;
export const RUNTIME_VIBE_TAGS = ["Under 15 Mins", "Under 30 Mins"] as const;

export const TMDB_GENRE_LABEL_BY_ID: Record<number, string> = {
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

export const TMDB_GENRE_DISPLAY_ORDER = [
  "Under 15 Mins",
  "Under 30 Mins",
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

export const TMDB_GENRE_SORT_INDEX = Object.fromEntries(
  TMDB_GENRE_DISPLAY_ORDER.map((label, index) => [label, index]),
) as Record<string, number>;

export const CANONICAL_GENRE_LABELS: Record<string, string> = {
  "action & adventure": "Action & Adventure",
  "sci-fi & fantasy": "Sci-Fi & Fantasy",
  "science fiction": "Science Fiction",
  "tv movie": "TV Movie",
  "war & politics": "War & Politics",
  "under 30 min": "Under 30 Mins",
  "under 30 mins": "Under 30 Mins",
  "under 30 minutes": "Under 30 Mins",
  "under 15 min": "Under 15 Mins",
  "under 15 mins": "Under 15 Mins",
  "under 15 minutes": "Under 15 Mins",
};
