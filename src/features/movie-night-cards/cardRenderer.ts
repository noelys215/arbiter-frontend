import type { CompletedSession } from "../sessions/sessions.api";
import { formatDecisionDuration, formatMovieNightDate, getWinner } from "../sessions/historyPresentation";

export type CardFormat = "square" | "portrait";
export type CardTemplate = "editorial" | "programme";

export type CardOptions = {
  format: CardFormat;
  template: CardTemplate;
  includeGroupName: boolean;
  includeMood: boolean;
  includeAttribution: boolean;
};

export type MovieNightCardData = {
  night: CompletedSession;
  moodLabels: string[];
  artworkDataUrl?: string | null;
};

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 },
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

function wrapText(value: string, maxCharacters: number, maxLines: number) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const current = lines.at(-1);
    if (!current || `${current} ${word}`.length > maxCharacters) {
      if (lines.length === maxLines) {
        lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.…]$/, "")}…`;
        break;
      }
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }
  return lines;
}

function truncateText(value: string, maxCharacters: number) {
  const normalized = value.trim();
  if (normalized.length <= maxCharacters) return normalized;
  return `${normalized.slice(0, maxCharacters - 1).trimEnd()}…`;
}

function svgTextLines(lines: string[], x: number, lineHeight: number) {
  return lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
}

function titleLayout(
  title: string,
  maxCharacters: number,
  maxLines: number,
  preferredSize: number,
  minimumSize: number,
) {
  const lines = wrapText(title, maxCharacters, maxLines);
  const longestLine = Math.max(...lines.map((line) => line.length), 1);
  const size = Math.max(
    minimumSize,
    Math.floor(preferredSize * Math.min(1, maxCharacters / longestLine)),
  );
  return { lines, size, lineHeight: Math.round(size * 1.02) };
}

function artworkMarkup(
  data: MovieNightCardData,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const initial = escapeXml(title.trim().charAt(0).toUpperCase() || "A");
  const frame = `<rect x="${x - 10}" y="${y - 10}" width="${width + 20}" height="${height + 20}" fill="#0E0908" stroke="#E0B15C" stroke-opacity="0.22"/>`;
  if (data.artworkDataUrl) {
    return `${frame}<image x="${x}" y="${y}" width="${width}" height="${height}" href="${escapeXml(data.artworkDataUrl)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `${frame}
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#211210"/>
    <text x="${x + width / 2}" y="${y + height / 2 + 42}" text-anchor="middle" fill="#E0B15C" fill-opacity="0.72" font-family="Georgia, serif" font-size="${Math.round(width * 0.42)}">${initial}</text>
    <text x="${x + width / 2}" y="${y + height - 34}" text-anchor="middle" fill="#D9C7A8" font-family="Arial, sans-serif" font-size="18" letter-spacing="4">FEATURE PRESENTATION</text>`;
}

function sharedFooter({
  width,
  height,
  inset,
  group,
  includeAttribution,
  portrait,
}: {
  width: number;
  height: number;
  inset: number;
  group: string;
  includeAttribution: boolean;
  portrait: boolean;
}) {
  const lineY = height - (portrait ? 162 : 116);
  const textY = height - (portrait ? 92 : 62);
  return `<line x1="${inset}" y1="${lineY}" x2="${width - inset}" y2="${lineY}" stroke="#E0B15C" stroke-opacity="0.2"/>
    <text x="${inset}" y="${textY}" fill="#D9C7A8" font-family="Arial, sans-serif" font-size="${portrait ? 27 : 20}">${escapeXml(group)}</text>
    ${includeAttribution ? `<text x="${width - inset}" y="${textY}" text-anchor="end" fill="#E0B15C" font-family="Georgia, serif" font-size="${portrait ? 32 : 25}">Arbiter</text>` : ""}`;
}

export function buildMovieNightCardSvg(
  data: MovieNightCardData,
  options: CardOptions,
) {
  const { width, height } = DIMENSIONS[options.format];
  const winner = getWinner(data.night);
  if (!winner) throw new Error("The completed movie night has no winner.");
  const portrait = options.format === "portrait";
  const date = formatMovieNightDate(data.night.completed_at ?? data.night.winner_selected_at);
  const duration = formatDecisionDuration(data.night.decision_duration_seconds);
  const participantText = `${data.night.participants.length} ${data.night.participants.length === 1 ? "participant" : "participants"}`;
  const context = [participantText, duration ? `decided in ${duration}` : null].filter(Boolean).join(" · ");
  const mood = options.includeMood ? data.moodLabels.slice(0, 3).join(" · ") : "";
  const group = options.includeGroupName
    ? truncateText(data.night.group_name, portrait ? 48 : 42)
    : "A private movie night";
  const eyebrow = `MOVIE NIGHT · ${escapeXml(date.toUpperCase())}`;

  if (portrait) {
    const editorial = options.template === "editorial";
    const title = titleLayout(winner.title, 22, 2, editorial ? 88 : 82, 58);
    const titleY = editorial ? 1390 : 270;
    const metadataY = titleY + title.lines.length * title.lineHeight + 40;
    const contextLines = wrapText(context, 46, 2);
    const moodLines = mood ? wrapText(mood, 42, 2) : [];
    const moodY = metadataY + contextLines.length * 42 + 20;
    const poster = editorial
      ? artworkMarkup(data, winner.title, 160, 70, 760, 1140)
      : artworkMarkup(data, winner.title, 270, 640, 540, 810);
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="#0E0908"/>
        ${editorial ? `<rect x="0" y="0" width="${width}" height="1240" fill="#281512"/>` : `<line x1="90" y1="90" x2="990" y2="90" stroke="#E0B15C" stroke-opacity="0.32"/>`}
        ${poster}
        <text x="90" y="${editorial ? 1305 : 165}" fill="#E0B15C" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4">${eyebrow}</text>
        <text x="90" y="${titleY}" fill="#F7EAD2" font-family="Georgia, serif" font-size="${title.size}" font-weight="700">${svgTextLines(title.lines, 90, title.lineHeight)}</text>
        <text x="90" y="${metadataY}" fill="#EAD9BC" font-family="Arial, sans-serif" font-size="31">${svgTextLines(contextLines, 90, 42)}</text>
        ${moodLines.length ? `<text x="90" y="${moodY}" fill="#CDB58E" font-family="Arial, sans-serif" font-size="29">${svgTextLines(moodLines, 90, 42)}</text>` : ""}
        ${sharedFooter({ width, height, inset: 90, group, includeAttribution: options.includeAttribution, portrait: true })}
      </svg>`;
  }

  const editorial = options.template === "editorial";
  const title = titleLayout(winner.title, editorial ? 13 : 14, 3, editorial ? 76 : 70, 48);
  const titleX = editorial ? 76 : 470;
  const titleY = editorial ? 230 : 220;
  const metadataY = titleY + title.lines.length * title.lineHeight + 46;
  const contextLines = wrapText(context, editorial ? 27 : 29, 2);
  const moodLines = mood ? wrapText(mood, editorial ? 27 : 24, 2) : [];
  const moodY = metadataY + contextLines.length * 34 + 18;
  const poster = editorial
    ? artworkMarkup(data, winner.title, 650, 70, 360, 540)
    : artworkMarkup(data, winner.title, 80, 90, 300, 450);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#0E0908"/>
      ${editorial ? `<rect x="600" y="0" width="480" height="760" fill="#281512"/>` : `<line x1="425" y1="90" x2="425" y2="610" stroke="#E0B15C" stroke-opacity="0.3"/>`}
      ${poster}
      <text x="${titleX}" y="112" fill="#E0B15C" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="4">${eyebrow}</text>
      <text x="${titleX}" y="${titleY}" fill="#F7EAD2" font-family="Georgia, serif" font-size="${title.size}" font-weight="700">${svgTextLines(title.lines, titleX, title.lineHeight)}</text>
      <text x="${titleX}" y="${metadataY}" fill="#EAD9BC" font-family="Arial, sans-serif" font-size="25">${svgTextLines(contextLines, titleX, 34)}</text>
      ${moodLines.length ? `<text x="${titleX}" y="${moodY}" fill="#CDB58E" font-family="Arial, sans-serif" font-size="23">${svgTextLines(moodLines, titleX, 34)}</text>` : ""}
      ${sharedFooter({ width, height, inset: 76, group, includeAttribution: options.includeAttribution, portrait: false })}
    </svg>`;
}

async function svgToPng(svg: string, width: number, height: number) {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render card artwork."));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export is not supported in this browser.");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to export the card.")), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function renderMovieNightCard(data: MovieNightCardData, options: CardOptions) {
  const winner = getWinner(data.night);
  const dimensions = DIMENSIONS[options.format];
  const svg = buildMovieNightCardSvg(data, options);
  const blob = await svgToPng(svg, dimensions.width, dimensions.height);
  return {
    blob,
    width: dimensions.width,
    height: dimensions.height,
    filename: `arbiter-${winner?.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "movie-night"}-${options.format}.png`,
  };
}
