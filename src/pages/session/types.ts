export type SwipeVote = "yes" | "maybe" | "no";
export type VibeInputMode = "tags" | "ai";

export type SessionContext = {
  tags: string[];
  moodSummary: string;
  aiWhy: string | null;
};
