import { describe, expect, it } from "vitest";
import {
  CARD_DIMENSIONS,
  CARD_TEMPLATES,
  cardFilename,
  createSafeCardPayload,
  normalizeCardTemplate,
  type CardOptions,
} from "./cardModel";
import { buildMovieNightCardSvg } from "./cardRenderer";
import { cardTestNight } from "./cardTestFixtures";

const baseOptions: CardOptions = {
  format: "square",
  template: "cinematic-poster",
  includeGroupName: false,
  includeMood: true,
  includeAttribution: true,
};

function payload(options: CardOptions = baseOptions) {
  return createSafeCardPayload(
    {
      night: cardTestNight,
      moodLabels: ["Easygoing", "Make us laugh", "Hidden gem"],
      artworkDataUrl: "data:image/jpeg;base64,cG9zdGVy",
      artworkKind: "poster",
      artworkAnalysis: {
        tone: "light",
        baseTone: "light",
        averageLuminance: 0.78,
        contrast: 0.2,
        isSparse: false,
      },
    },
    options,
  );
}

describe("movie night card rendering", () => {
  it("renders all three templates at both exact output dimensions", () => {
    for (const template of CARD_TEMPLATES.map((item) => item.value)) {
      for (const format of ["square", "portrait"] as const) {
        const options = { ...baseOptions, template, format };
        const svg = buildMovieNightCardSvg(payload(options), options);
        const dimensions = CARD_DIMENSIONS[format];
        expect(svg).toContain(
          `width="${dimensions.width}" height="${dimensions.height}"`,
        );
        expect(svg).toContain("Beautiful");
        expect(svg).toContain("Film");
      }
    }
  });

  it("maps every legacy style to a stable new template", () => {
    expect(normalizeCardTemplate("editorial-poster")).toBe(
      "cinematic-poster",
    );
    expect(normalizeCardTemplate("editorial")).toBe("cinematic-poster");
    expect(normalizeCardTemplate("minimal-programme")).toBe(
      "editorial-programme",
    );
    expect(normalizeCardTemplate("programme")).toBe("editorial-programme");
  });

  it("sanitizes the full session before composition", () => {
    const safe = payload();
    const serialized = JSON.stringify(safe);
    expect(serialized).not.toContain("private-session-id");
    expect(serialized).not.toContain("private-group-id");
    expect(serialized).not.toContain("private-user-id");
    expect(serialized).not.toContain("Private Participant");
    expect(serialized).not.toContain("private.example");
    expect(serialized).not.toContain("yes_count");
    expect(serialized).not.toContain("Teleparty");
    expect(safe.moods).toEqual(["Easygoing", "Make us laugh"]);
    expect(safe.groupName).toBeNull();
  });

  it("includes the group only after explicit selection", () => {
    const options = { ...baseOptions, includeGroupName: true };
    const safe = payload(options);
    expect(safe.groupName).toBe("Match Club");
    expect(buildMovieNightCardSvg(safe, options)).toContain("Match Club");
  });

  it("embeds artwork or renders a typography-safe fallback", () => {
    const safe = payload();
    expect(buildMovieNightCardSvg(safe, baseOptions)).toContain("<image");
    const noArtwork = { ...safe, artworkDataUrl: null, artworkKind: null };
    const svg = buildMovieNightCardSvg(noArtwork, baseOptions);
    expect(svg).not.toContain("<image");
    expect(svg).toContain(">A</text>");
  });

  it("keeps fallback typography inside shallow editorial artwork strips", () => {
    const options = {
      ...baseOptions,
      template: "editorial-programme" as const,
    };
    const noArtwork = {
      ...payload(options),
      artworkDataUrl: null,
      artworkKind: null,
    };
    const svg = buildMovieNightCardSvg(noArtwork, options);

    expect(svg).toMatch(/font-size="149"[^>]*>A<\/text>/);
  });

  it("creates a deterministic, sanitized filename with the completed date", () => {
    expect(cardFilename(payload(), "square")).toBe(
      "arbiter-a-beautiful-film-2026-07-20-square.png",
    );
  });
});
