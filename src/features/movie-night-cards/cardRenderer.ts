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

function svgTextLines(lines: string[], x: number, lineHeight: number) {
  return lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
}

export function buildMovieNightCardSvg(
  data: MovieNightCardData,
  options: CardOptions,
) {
  const { width, height } = DIMENSIONS[options.format];
  const winner = getWinner(data.night);
  if (!winner) throw new Error("The completed movie night has no winner.");
  const portrait = options.format === "portrait";
  const titleSize = portrait ? 100 : 74;
  const titleLines = wrapText(winner.title, portrait ? 18 : 22, portrait ? 4 : 3);
  const date = formatMovieNightDate(data.night.completed_at ?? data.night.winner_selected_at);
  const duration = formatDecisionDuration(data.night.decision_duration_seconds);
  const participantText = `${data.night.participants.length} ${data.night.participants.length === 1 ? "participant" : "participants"}`;
  const context = [participantText, duration ? `decided in ${duration}` : null].filter(Boolean).join(" · ");
  const mood = options.includeMood ? data.moodLabels.slice(0, 3).join(" · ") : "";
  const group = options.includeGroupName ? data.night.group_name : "A private movie night";
  const artHeight = portrait ? 980 : 610;
  const contentTop = artHeight - (portrait ? 80 : 60);
  const posterWidth = portrait ? 600 : 400;
  const posterHeight = portrait ? 900 : 560;
  const posterX = (width - posterWidth) / 2;
  const posterY = (artHeight - posterHeight) / 2;
  const fallbackInitial = escapeXml(winner.title.trim().charAt(0).toUpperCase() || "A");
  const artwork = data.artworkDataUrl
    ? `<rect x="0" y="0" width="${width}" height="${artHeight}" fill="#2A1713"/>
       <rect x="${posterX - 12}" y="${posterY - 12}" width="${posterWidth + 24}" height="${posterHeight + 24}" fill="#100806" stroke="#E0B15C" stroke-opacity="0.28"/>
       <image x="${posterX}" y="${posterY}" width="${posterWidth}" height="${posterHeight}" href="${escapeXml(data.artworkDataUrl)}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="0" y="0" width="${width}" height="${artHeight}" fill="#2A1713"/>
       <rect x="${posterX}" y="${posterY}" width="${posterWidth}" height="${posterHeight}" fill="#1C110F" stroke="#E0B15C" stroke-opacity="0.28"/>
       <text x="${width / 2}" y="${artHeight / 2 + (portrait ? 72 : 50)}" text-anchor="middle" fill="#E0B15C" fill-opacity="0.7" font-family="Georgia, serif" font-size="${portrait ? 220 : 150}">${fallbackInitial}</text>
       <text x="${width / 2}" y="${artHeight - (portrait ? 58 : 34)}" text-anchor="middle" fill="#D9C7A8" font-family="Arial, sans-serif" font-size="${portrait ? 24 : 18}" letter-spacing="5">FEATURE PRESENTATION</text>`;
  const titleY = contentTop + (portrait ? 225 : 170);
  const metadataY = titleY + titleLines.length * (titleSize * 1.03) + (portrait ? 56 : 38);
  const titleBlock = options.template === "programme"
    ? `<rect x="${portrait ? 75 : 64}" y="${contentTop - 45}" width="${portrait ? 930 : 952}" height="${height - contentTop - 75}" fill="#1C110F" stroke="#E0B15C" stroke-opacity="0.24"/>`
    : `<rect x="0" y="${contentTop}" width="${width}" height="${height - contentTop}" fill="#140C0A"/>`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#140C0A"/>
      ${artwork}
      ${titleBlock}
      <text x="${portrait ? 120 : 96}" y="${contentTop + (portrait ? 68 : 54)}" fill="#E0B15C" font-family="Arial, sans-serif" font-size="${portrait ? 25 : 20}" font-weight="700" letter-spacing="4">MOVIE NIGHT · ${escapeXml(date.toUpperCase())}</text>
      <text x="${portrait ? 120 : 96}" y="${titleY}" fill="#F7EAD2" font-family="Georgia, serif" font-size="${titleSize}" font-weight="700">${svgTextLines(titleLines, portrait ? 120 : 96, titleSize * 1.03)}</text>
      <text x="${portrait ? 120 : 96}" y="${metadataY}" fill="#EAD9BC" font-family="Arial, sans-serif" font-size="${portrait ? 34 : 25}">${escapeXml(context)}</text>
      ${mood ? `<text x="${portrait ? 120 : 96}" y="${metadataY + (portrait ? 68 : 50)}" fill="#CDB58E" font-family="Arial, sans-serif" font-size="${portrait ? 31 : 23}">${escapeXml(mood)}</text>` : ""}
      <line x1="${portrait ? 120 : 96}" y1="${height - (portrait ? 205 : 120)}" x2="${width - (portrait ? 120 : 96)}" y2="${height - (portrait ? 205 : 120)}" stroke="#E0B15C" stroke-opacity="0.24"/>
      <text x="${portrait ? 120 : 96}" y="${height - (portrait ? 135 : 70)}" fill="#D9C7A8" font-family="Arial, sans-serif" font-size="${portrait ? 29 : 21}">${escapeXml(group)}</text>
      ${options.includeAttribution ? `<text x="${width - (portrait ? 120 : 96)}" y="${height - (portrait ? 135 : 70)}" text-anchor="end" fill="#E0B15C" font-family="Georgia, serif" font-size="${portrait ? 34 : 25}">Arbiter</text>` : ""}
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
