import { describe, expect, it } from "vitest";
import {
  classifyArtworkPixels,
  selectArtworkKind,
} from "./artworkAnalysis";

function pixels(values: Array<[number, number, number]>) {
  return new Uint8ClampedArray(values.flatMap(([r, g, b]) => [r, g, b, 255]));
}

describe("card artwork analysis", () => {
  it("classifies light, dark, mixed, and sparse samples deterministically", () => {
    expect(
      classifyArtworkPixels(pixels([[250, 250, 250], [255, 255, 255]])),
    ).toMatchObject({ tone: "sparse", baseTone: "light", isSparse: true });
    expect(
      classifyArtworkPixels(pixels([[4, 4, 4], [45, 45, 45], [90, 90, 90]])),
    ).toMatchObject({ baseTone: "dark" });
    expect(
      classifyArtworkPixels(pixels([[0, 0, 0], [255, 255, 255]])),
    ).toMatchObject({ tone: "mixed", baseTone: "mixed", isSparse: false });
  });

  it("chooses artwork by template, format, and availability", () => {
    expect(
      selectArtworkKind({
        template: "cinematic-poster",
        format: "square",
        hasPoster: true,
        canRequestBackdrop: true,
        titleLength: 8,
      }),
    ).toBe("backdrop");
    expect(
      selectArtworkKind({
        template: "archive-card",
        format: "portrait",
        hasPoster: true,
        canRequestBackdrop: true,
        titleLength: 8,
      }),
    ).toBe("poster");
    expect(
      selectArtworkKind({
        template: "editorial-programme",
        format: "portrait",
        hasPoster: false,
        canRequestBackdrop: false,
        titleLength: 50,
      }),
    ).toBeNull();
  });
});

