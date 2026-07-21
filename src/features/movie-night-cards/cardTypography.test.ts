import { describe, expect, it } from "vitest";
import { estimateTextWidth, fitCardTitle } from "./cardTypography";

const options = {
  maxWidth: 760,
  maxLines: 4,
  preferredSize: 120,
  minimumSize: 48,
};

describe("card title fitting", () => {
  it.each([
    "Up",
    "One Piece",
    "Everything Everywhere All at Once",
    "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb",
    "千と千尋の神隠し",
    "Birdman or (The Unexpected Virtue of Ignorance)",
  ])("fits %s without truncation", (title) => {
    const fit = fitCardTitle(title, options);
    expect(fit.lines.join(" ").replace(/\s+/g, "")).toBe(
      title.replace(/\s+/g, ""),
    );
    expect(fit.lines.length).toBeLessThanOrEqual(options.maxLines);
    expect(fit.fontSize).toBeGreaterThanOrEqual(options.minimumSize);
    expect(
      Math.max(...fit.lines.map((line) => estimateTextWidth(line, fit.fontSize))),
    ).toBeLessThanOrEqual(options.maxWidth + 1);
  });
});

