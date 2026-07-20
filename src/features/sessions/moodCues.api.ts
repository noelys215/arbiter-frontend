import { apiJson } from "../../lib/api";

export type MoodCueCategory = "energy" | "effect" | "occasion" | "taste";

export type MoodCue = {
  id: string;
  label: string;
  description: string;
  category: MoodCueCategory;
  display_order: number;
};

export async function getMoodCues() {
  return apiJson<MoodCue[]>("/mood-cues");
}
