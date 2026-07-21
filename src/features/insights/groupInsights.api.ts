import { apiJson } from "../../lib/api";
import type { AvatarSource } from "../avatar/avatarTypes";

export type InsightsPeriodKey = "all_time" | "this_year";
export type InsightsConfidenceTier =
  | "empty"
  | "basic"
  | "emerging"
  | "established";

export type RankedInsight = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type InsightsRecord = {
  key: string;
  label: string;
  value: string;
  detail: string | null;
  session_id: string | null;
};

export type GroupInsights = {
  group_id: string;
  group_name: string;
  calculation_version: string;
  period: {
    key: InsightsPeriodKey;
    label: string;
    starts_at: string | null;
    ends_at: string;
  };
  availability: {
    sample_size: number;
    confidence_tier: InsightsConfidenceTier;
    personality_available: boolean;
    member_highlights_available: boolean;
    reason_unavailable: string | null;
    next_tier_at: number | null;
  };
  activity: {
    completed_nights: number;
    confirmed_watched_nights: number;
    total_watch_minutes: number;
    average_watched_runtime_minutes: number | null;
    unique_winners: number;
    unique_genres_explored: number;
  };
  decision: {
    average_seconds: number | null;
    median_seconds: number | null;
    average_candidate_count: number | null;
    unanimous_rate: number | null;
    unanimous_sample_size: number;
  };
  taste: {
    genres: RankedInsight[];
    moods: RankedInsight[];
    runtime_bands: RankedInsight[];
  };
  records: InsightsRecord[];
  personality: null | {
    title: string;
    description: string;
    supporting_facts: string[];
    dimensions: Array<{
      key: string;
      label: string;
      value: number;
      interpretation: string;
    }>;
    sample_size: number;
    confidence_tier: InsightsConfidenceTier;
  };
  member_highlights: Array<{
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    avatar_source: AvatarSource | null;
    avatar_style: string | null;
    avatar_seed: string | null;
    title: string;
    explanation: string;
  }>;
  data_quality: {
    watched_runtimes_known: number;
    watched_runtimes_missing: number;
    decisions_timed: number;
    unanimity_known: number;
    sessions_with_vote_snapshots: number;
    notes: string[];
  };
};

export const groupInsightsQueryKey = (
  groupId: string,
  period: InsightsPeriodKey,
) => ["group-insights", groupId, period] as const;

export async function getGroupInsights(
  groupId: string,
  period: InsightsPeriodKey,
) {
  const params = new URLSearchParams({ period });
  return apiJson<GroupInsights>(
    `/groups/${encodeURIComponent(groupId)}/insights?${params.toString()}`,
  );
}
