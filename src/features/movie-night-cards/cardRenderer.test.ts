import { describe, expect, it } from "vitest";
import {
  CARD_DIMENSIONS,
  CARD_TEMPLATES,
  cardFilename,
  createSafeCardPayload,
  normalizeCardTemplate,
  type CardOptions,
  type SafeCardPayload,
} from "./cardModel";
import {
  buildMovieNightCardSvg,
  getEditorialProgrammeLayout,
} from "./cardRenderer";
import { estimateTextWidth } from "./cardTypography";
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

const editorialOptions: CardOptions = {
  ...baseOptions,
  template: "editorial-programme",
};

function editorialPayload(
  title: string,
  overrides: Partial<SafeCardPayload> = {},
) {
  return { ...payload(editorialOptions), title, ...overrides };
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
    const layout = getEditorialProgrammeLayout(noArtwork, options);
    const fallbackSize = Number(
      svg.match(/font-size="(\d+)"[^>]*>A<\/text>/)?.[1],
    );

    expect(fallbackSize).toBeGreaterThan(0);
    expect(fallbackSize).toBeLessThanOrEqual(layout.stripHeight * 0.55 + 1);
  });

  it.each([
    "Up",
    "Midsommar",
    "Michiko & Hatchin",
    "The Ghost in the Shell",
    "Everything Everywhere All at Once",
    "A Deliberately Long Three Line Programme Title",
  ])("keeps Editorial Programme geometry stable for %s", (title) => {
    for (const format of ["square", "portrait"] as const) {
      const options = { ...editorialOptions, format };
      const layout = getEditorialProgrammeLayout(
        editorialPayload(title),
        options,
      );
      const titleEnd =
        layout.titleY +
        (layout.title.lines.length - 1) * layout.title.lineHeight;

      expect(layout.title.lines.join(" ")).toBe(title);
      expect(layout.title.lines.length).toBeLessThanOrEqual(
        format === "portrait" ? 5 : 4,
      );
      expect(titleEnd).toBeLessThan(layout.moodY);
      expect(layout.moodY).toBeLessThan(layout.stripY);
      expect(layout.stripHeight).toBeGreaterThan(0);
    }
  });

  it("gives short one-line titles more authority and tightens three-line rhythm", () => {
    const short = getEditorialProgrammeLayout(
      editorialPayload("Up"),
      editorialOptions,
    );
    const threeLine = getEditorialProgrammeLayout(
      editorialPayload("A Deliberately Long Three Line Programme Title"),
      editorialOptions,
    );

    expect(short.title.lines).toHaveLength(1);
    expect(short.title.fontSize).toBeGreaterThanOrEqual(140);
    expect(threeLine.title.lines.length).toBeGreaterThanOrEqual(3);
    expect(threeLine.title.lineHeight).toBe(
      Math.round(threeLine.title.fontSize * 0.86),
    );
  });

  it("uses backdrop strips, bounded detail crops, and contained sparse posters", () => {
    const backdrop = getEditorialProgrammeLayout(
      editorialPayload("Midsommar", { artworkKind: "backdrop" }),
      editorialOptions,
    );
    const detail = getEditorialProgrammeLayout(
      editorialPayload("Midsommar", {
        artworkKind: "poster",
        artworkAnalysis: {
          tone: "dark",
          baseTone: "dark",
          averageLuminance: 0.12,
          contrast: 0.35,
          isSparse: false,
        },
      }),
      editorialOptions,
    );
    const sparse = getEditorialProgrammeLayout(
      editorialPayload("Midsommar", {
        artworkKind: "poster",
        artworkAnalysis: {
          tone: "sparse",
          baseTone: "light",
          averageLuminance: 0.8,
          contrast: 0.04,
          isSparse: true,
        },
      }),
      editorialOptions,
    );

    expect(backdrop).toMatchObject({
      artworkMode: "cinematic-strip",
      artworkWidth: 936,
      artworkFit: "slice",
    });
    expect(detail.artworkMode).toBe("detail-crop");
    expect(detail.artworkWidth).toBe(Math.round(936 * 0.8));
    expect(sparse).toMatchObject({
      artworkMode: "contained-poster",
      artworkWidth: 936,
      artworkFit: "meet",
    });
  });

  it("personalizes and safely fits the programme eyebrow", () => {
    const standard = getEditorialProgrammeLayout(
      editorialPayload("Midsommar", { groupName: null }),
      editorialOptions,
    );
    const longName = "The Extremely Long International Sunday Cinema Society";
    const personalized = getEditorialProgrammeLayout(
      editorialPayload("Midsommar", { groupName: longName }),
      editorialOptions,
    );
    const fittedWidth =
      estimateTextWidth(personalized.eyebrow, personalized.eyebrowFontSize) +
      (Array.from(personalized.eyebrow).length - 1) *
        personalized.eyebrowTracking;

    expect(standard.eyebrow).toBe("ARBITER / SCREENING PROGRAMME");
    expect(personalized.eyebrow).toBe(
      `${longName.toUpperCase()} / SCREENING PROGRAMME`,
    );
    expect(fittedWidth).toBeLessThanOrEqual(936);
  });

  it("renders at most two stable mood cues and clarifies the footer hierarchy", () => {
    const withManyMoods = editorialPayload("Midsommar", {
      moods: ["Easygoing", "Make us laugh", "Hidden gem"],
    });
    const svg = buildMovieNightCardSvg(withManyMoods, editorialOptions);
    const noMoodSvg = buildMovieNightCardSvg(
      { ...withManyMoods, moods: [] },
      editorialOptions,
    );

    expect(svg).toContain("EASYGOING · MAKE US LAUGH");
    expect(svg).not.toContain("Hidden gem");
    expect(svg).toContain("MOVIE NIGHT · JULY 20, 2026");
    expect(svg).toContain(">Decided together</text>");
    expect(noMoodSvg).toContain("TONIGHT’S CHOICE");
  });

  it("creates a deterministic, sanitized filename with the completed date", () => {
    expect(cardFilename(payload(), "square")).toBe(
      "arbiter-a-beautiful-film-2026-07-20-square.png",
    );
  });
});
