import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatInsightDuration,
  formatWatchTime,
} from "./insightsPresentation";

describe("insights presentation", () => {
  it("formats durations and watch time without false precision", () => {
    expect(formatInsightDuration(null)).toBeNull();
    expect(formatInsightDuration(480)).toBe("8 min");
    expect(formatInsightDuration(7200)).toBe("2h");
    expect(formatWatchTime(154)).toBe("2h 34m");
  });

  it("uses correct count grammar", () => {
    expect(formatCount(1, "night")).toBe("1 night");
    expect(formatCount(2, "night")).toBe("2 nights");
  });
});
