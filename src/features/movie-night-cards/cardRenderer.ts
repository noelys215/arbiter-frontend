import type { ArtworkAnalysis } from "./artworkAnalysis";
import {
  archiveFacts,
  CARD_DIMENSIONS,
  contextLine,
  footerCopy,
  type CardOptions,
  type SafeCardPayload,
} from "./cardModel";
import { fitCardTitle, type TitleFit } from "./cardTypography";

export type { CardFormat, CardOptions, CardTemplate } from "./cardModel";

type CardAssets = {
  displayFontDataUrl?: string | null;
};

function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] ?? character,
  );
}

function fontDefinitions(dataUrl?: string | null) {
  return dataUrl
    ? `<style>
      @font-face {
        font-family: "Arbiter Display";
        src: url("${dataUrl}") format("opentype");
        font-weight: 400;
      }
      .display { font-family: "Arbiter Display", Georgia, serif; }
      .body { font-family: Arial, Helvetica, sans-serif; }
    </style>`
    : `<style>
      .display { font-family: Georgia, serif; }
      .body { font-family: Arial, Helvetica, sans-serif; }
    </style>`;
}

function textLines(
  fit: TitleFit,
  x: number,
  y: number,
  fill = "#F7EAD2",
  anchor: "start" | "middle" | "end" = "start",
) {
  const tspans = fit.lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : fit.lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return `<text class="display" x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="${fit.fontSize}">${tspans}</text>`;
}

function artworkImage(
  payload: SafeCardPayload,
  {
    x,
    y,
    width,
    height,
    clipId,
    opacity = 1,
    fit = "slice",
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    clipId: string;
    opacity?: number;
    fit?: "meet" | "slice";
  },
) {
  if (!payload.artworkDataUrl) return "";
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${escapeXml(payload.artworkDataUrl)}" preserveAspectRatio="xMidYMid ${fit}" clip-path="url(#${clipId})" opacity="${opacity}"/>`;
}

function fallbackArtwork(
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const initial = Array.from(title.trim())[0]?.toUpperCase() || "A";
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#2A1713"/>
    <line x1="${x + width * 0.18}" y1="${y + height * 0.18}" x2="${x + width * 0.82}" y2="${y + height * 0.82}" stroke="#E0B15C" stroke-opacity="0.15"/>
    <text class="display" x="${x + width / 2}" y="${y + height * 0.66}" text-anchor="middle" fill="#E0B15C" fill-opacity="0.5" font-size="${Math.round(Math.min(width, height) * 0.55)}">${escapeXml(initial)}</text>`;
}

function overlayOpacity(analysis: ArtworkAnalysis | null) {
  if (!analysis) return 0.78;
  if (analysis.isSparse || analysis.baseTone === "light") return 0.92;
  if (analysis.baseTone === "dark") return 0.68;
  return 0.8;
}

function eyebrow(payload: SafeCardPayload) {
  return `MOVIE NIGHT · ${payload.date.toUpperCase()}`;
}

function brandMark(width: number, y: number) {
  return `<text class="display" x="${width - 72}" y="${y}" text-anchor="end" fill="#E0B15C" font-size="28">Arbiter</text>`;
}

function cinematicPoster(
  payload: SafeCardPayload,
  options: CardOptions,
) {
  const portrait = options.format === "portrait";
  const { width, height } = CARD_DIMENSIONS[options.format];
  const art = payload.artworkDataUrl
    ? artworkImage(payload, {
        x: portrait ? 0 : 330,
        y: 0,
        width: portrait ? width : 750,
        height,
        clipId: "cinematic-art",
      })
    : fallbackArtwork(
        payload.title,
        portrait ? 0 : 330,
        0,
        portrait ? width : 750,
        height,
      );
  const title = fitCardTitle(payload.title, {
    maxWidth: portrait ? 900 : 490,
    maxLines: portrait ? 4 : 4,
    preferredSize: portrait ? 124 : 108,
    minimumSize: portrait ? 64 : 56,
  });
  const titleY = portrait ? 1180 : 342;
  const titleEnd = titleY + (title.lines.length - 1) * title.lineHeight;
  const detail = contextLine(payload) || "Decided together";
  const detailY = titleEnd + (portrait ? 88 : 68);
  const footer = footerCopy(payload, options.template);

  return `<rect width="${width}" height="${height}" fill="#100907"/>
    ${art}
    <rect width="${width}" height="${height}" fill="url(#cinematic-shade)"/>
    <text class="body" x="72" y="${portrait ? 104 : 92}" fill="#F0C875" font-size="${portrait ? 25 : 20}" font-weight="700" letter-spacing="5">${escapeXml(eyebrow(payload))}</text>
    ${textLines(title, 72, titleY)}
    <line x1="72" y1="${detailY - 38}" x2="${portrait ? 390 : 230}" y2="${detailY - 38}" stroke="#E0B15C" stroke-width="3"/>
    <text class="body" x="72" y="${detailY}" fill="#EAD9BC" font-size="${portrait ? 31 : 24}">${escapeXml(detail)}</text>
    <text class="body" x="72" y="${height - 74}" fill="#D1B78F" font-size="${portrait ? 25 : 19}">${escapeXml(footer)}</text>
    ${payload.includeAttribution ? brandMark(width, height - 70) : ""}`;
}

function editorialProgramme(
  payload: SafeCardPayload,
  options: CardOptions,
) {
  const portrait = options.format === "portrait";
  const { width, height } = CARD_DIMENSIONS[options.format];
  const title = fitCardTitle(payload.title, {
    maxWidth: portrait ? 890 : 820,
    maxLines: portrait ? 5 : 4,
    preferredSize: portrait ? 154 : 126,
    minimumSize: portrait ? 66 : 54,
  });
  const titleY = portrait ? 310 : 275;
  const titleEnd = titleY + (title.lines.length - 1) * title.lineHeight;
  const stripY = portrait ? 1020 : 690;
  const stripHeight = portrait ? 430 : 270;
  const image = payload.artworkDataUrl
    ? artworkImage(payload, {
        x: 72,
        y: stripY,
        width: width - 144,
        height: stripHeight,
        clipId: "programme-art",
      })
    : fallbackArtwork(
        payload.title,
        72,
        stripY,
        width - 144,
        stripHeight,
      );
  const context = payload.moods.join(" · ") || "Tonight’s choice";
  const footer = footerCopy(payload, options.template);

  return `<rect width="${width}" height="${height}" fill="#18100E"/>
    <rect x="34" y="34" width="${width - 68}" height="${height - 68}" fill="none" stroke="#E0B15C" stroke-opacity="0.24"/>
    <text class="body" x="72" y="${portrait ? 105 : 88}" fill="#D4B06B" font-size="${portrait ? 23 : 18}" font-weight="700" letter-spacing="6">ARBITER / SCREENING PROGRAMME</text>
    <line x1="72" y1="${portrait ? 142 : 122}" x2="${width - 72}" y2="${portrait ? 142 : 122}" stroke="#E0B15C" stroke-opacity="0.35"/>
    ${textLines(title, 72, titleY)}
    <text class="body" x="72" y="${Math.max(titleEnd + 92, portrait ? 760 : 565)}" fill="#E0B15C" font-size="${portrait ? 28 : 22}" letter-spacing="2">${escapeXml(context.toUpperCase())}</text>
    ${image}
    <text class="body" x="72" y="${stripY + stripHeight + (portrait ? 82 : 60)}" fill="#EAD9BC" font-size="${portrait ? 29 : 22}">${escapeXml(eyebrow(payload))}</text>
    <line x1="72" y1="${height - 142}" x2="${width - 72}" y2="${height - 142}" stroke="#E0B15C" stroke-opacity="0.22"/>
    <text class="body" x="72" y="${height - 83}" fill="#D1B78F" font-size="${portrait ? 25 : 19}">${escapeXml(footer)}</text>
    ${payload.includeAttribution ? brandMark(width, height - 79) : ""}`;
}

function archiveCard(payload: SafeCardPayload, options: CardOptions) {
  const portrait = options.format === "portrait";
  const { width, height } = CARD_DIMENSIONS[options.format];
  const artX = portrait ? 110 : 70;
  const artY = portrait ? 190 : 195;
  const artWidth = portrait ? 420 : 325;
  const artHeight = portrait ? 630 : 490;
  const image = payload.artworkDataUrl
    ? artworkImage(payload, {
        x: artX,
        y: artY,
        width: artWidth,
        height: artHeight,
        clipId: "archive-art",
        fit: payload.artworkKind === "poster" ? "meet" : "slice",
      })
    : fallbackArtwork(payload.title, artX, artY, artWidth, artHeight);
  const titleX = portrait ? 110 : 455;
  const titleY = portrait ? 965 : 300;
  const title = fitCardTitle(payload.title, {
    maxWidth: portrait ? 860 : 535,
    maxLines: portrait ? 4 : 4,
    preferredSize: portrait ? 112 : 82,
    minimumSize: portrait ? 58 : 44,
  });
  const titleEnd = titleY + (title.lines.length - 1) * title.lineHeight;
  const facts = archiveFacts(payload);
  const factsStart = titleEnd + (portrait ? 110 : 90);
  const mood = payload.moods.join(" · ");
  const archiveLabel = payload.groupName
    ? `${payload.groupName.toUpperCase()} / ARCHIVE`
    : "ARBITER / MOVIE NIGHT ARCHIVE";

  return `<rect width="${width}" height="${height}" fill="#130C0A"/>
    <rect x="36" y="36" width="${width - 72}" height="${height - 72}" fill="#1C110F" stroke="#E0B15C" stroke-opacity="0.28"/>
    <text class="body" x="70" y="98" fill="#D4B06B" font-size="${portrait ? 22 : 18}" font-weight="700" letter-spacing="5">${escapeXml(archiveLabel)}</text>
    <text class="body" x="${width - 70}" y="98" text-anchor="end" fill="#BFA986" font-size="${portrait ? 22 : 18}">${escapeXml(payload.date)}</text>
    <line x1="70" y1="132" x2="${width - 70}" y2="132" stroke="#E0B15C" stroke-opacity="0.32"/>
    <rect x="${artX - 9}" y="${artY - 9}" width="${artWidth + 18}" height="${artHeight + 18}" fill="#0D0807" stroke="#E0B15C" stroke-opacity="0.2"/>
    ${image}
    ${textLines(title, titleX, titleY)}
    <text class="body" x="${titleX}" y="${factsStart}" fill="#D8C5A5" font-size="${portrait ? 29 : 23}">${facts
      .map(
        (fact, index) =>
          `<tspan x="${titleX}" dy="${index === 0 ? 0 : portrait ? 52 : 42}">${escapeXml(fact)}</tspan>`,
      )
      .join("")}</text>
    ${mood ? `<line x1="${titleX}" y1="${factsStart + facts.length * (portrait ? 52 : 42) + 18}" x2="${portrait ? width - 110 : width - 70}" y2="${factsStart + facts.length * (portrait ? 52 : 42) + 18}" stroke="#E0B15C" stroke-opacity="0.18"/><text class="body" x="${titleX}" y="${factsStart + facts.length * (portrait ? 52 : 42) + 64}" fill="#E0B15C" font-size="${portrait ? 27 : 21}">${escapeXml(mood)}</text>` : ""}
    <text class="body" x="70" y="${height - 82}" fill="#D1B78F" font-size="${portrait ? 24 : 18}">${escapeXml(footerCopy(payload, options.template))}</text>
    ${payload.includeAttribution ? brandMark(width, height - 78) : ""}`;
}

export function buildMovieNightCardSvg(
  payload: SafeCardPayload,
  options: CardOptions,
  assets: CardAssets = {},
) {
  const { width, height } = CARD_DIMENSIONS[options.format];
  const content =
    options.template === "cinematic-poster"
      ? cinematicPoster(payload, options)
      : options.template === "editorial-programme"
        ? editorialProgramme(payload, options)
        : archiveCard(payload, options);
  const strength = overlayOpacity(payload.artworkAnalysis);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      ${fontDefinitions(assets.displayFontDataUrl)}
      <clipPath id="cinematic-art"><rect x="0" y="0" width="${width}" height="${height}"/></clipPath>
      <clipPath id="programme-art"><rect x="0" y="0" width="${width}" height="${height}"/></clipPath>
      <clipPath id="archive-art"><rect x="0" y="0" width="${width}" height="${height}"/></clipPath>
      <linearGradient id="cinematic-shade" x1="0" y1="0" x2="1" y2="${options.format === "portrait" ? 1 : 0}">
        <stop offset="0" stop-color="#100907" stop-opacity="0.98"/>
        <stop offset="${options.format === "portrait" ? 0.42 : 0.38}" stop-color="#100907" stop-opacity="${strength}"/>
        <stop offset="1" stop-color="#100907" stop-opacity="${options.format === "portrait" ? 0.78 : 0.08}"/>
      </linearGradient>
    </defs>
    ${content}
  </svg>`;
}
