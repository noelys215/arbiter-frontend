import type { CardFormat, CardTemplate } from "./cardModel";

export type ArtworkKind = "poster" | "backdrop";
export type ArtworkTone = "light" | "dark" | "mixed" | "sparse" | "unknown";

export type ArtworkAnalysis = {
  tone: ArtworkTone;
  baseTone: "light" | "dark" | "mixed" | "unknown";
  averageLuminance: number;
  contrast: number;
  isSparse: boolean;
};

const UNKNOWN_ANALYSIS: ArtworkAnalysis = {
  tone: "unknown",
  baseTone: "unknown",
  averageLuminance: 0.35,
  contrast: 0.35,
  isSparse: false,
};

function channelLuminance(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function classifyArtworkPixels(
  pixels: Uint8ClampedArray,
): ArtworkAnalysis {
  const luminances: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 16) continue;
    luminances.push(
      0.2126 * channelLuminance(pixels[index]) +
        0.7152 * channelLuminance(pixels[index + 1]) +
        0.0722 * channelLuminance(pixels[index + 2]),
    );
  }
  if (!luminances.length) return UNKNOWN_ANALYSIS;
  const average =
    luminances.reduce((total, value) => total + value, 0) /
    luminances.length;
  const variance =
    luminances.reduce(
      (total, value) => total + (value - average) ** 2,
      0,
    ) / luminances.length;
  const contrast = Math.sqrt(variance);
  const isSparse = contrast < 0.075;
  const baseTone =
    average >= 0.62 ? "light" : average <= 0.2 ? "dark" : "mixed";
  return {
    tone: isSparse ? "sparse" : baseTone,
    baseTone,
    averageLuminance: Number(average.toFixed(3)),
    contrast: Number(contrast.toFixed(3)),
    isSparse,
  };
}

export async function analyzeArtworkDataUrl(dataUrl: string) {
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = dataUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return UNKNOWN_ANALYSIS;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return classifyArtworkPixels(
      context.getImageData(0, 0, canvas.width, canvas.height).data,
    );
  } catch {
    return UNKNOWN_ANALYSIS;
  }
}

export function selectArtworkKind({
  template,
  format,
  hasPoster,
  canRequestBackdrop,
  titleLength,
}: {
  template: CardTemplate;
  format: CardFormat;
  hasPoster: boolean;
  canRequestBackdrop: boolean;
  titleLength: number;
}): ArtworkKind | null {
  if (!hasPoster && !canRequestBackdrop) return null;
  if (template === "archive-card") {
    return hasPoster ? "poster" : "backdrop";
  }
  if (template === "cinematic-poster") {
    return canRequestBackdrop ? "backdrop" : "poster";
  }
  if (format === "portrait" && titleLength > 34 && canRequestBackdrop) {
    return "backdrop";
  }
  return hasPoster ? "poster" : "backdrop";
}

export const fallbackArtworkAnalysis = UNKNOWN_ANALYSIS;

