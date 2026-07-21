import {
  cardFilename,
  CARD_DIMENSIONS,
  type CardOptions,
  type SafeCardPayload,
} from "./cardModel";
import { buildMovieNightCardSvg } from "./cardRenderer";

async function loadSvgImage(svg: string) {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.decoding = "sync";
  image.src = url;
  try {
    if (typeof image.decode === "function") {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to render card artwork."));
      });
    }
    return { image, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to export the card."));
    }, "image/png");
  });
}

export async function exportMovieNightCard(
  payload: SafeCardPayload,
  options: CardOptions,
  displayFontDataUrl?: string | null,
) {
  const dimensions = CARD_DIMENSIONS[options.format];
  const svg = buildMovieNightCardSvg(payload, options, { displayFontDataUrl });
  const { image, url } = await loadSvgImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  try {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Image export is not supported in this browser.");
    }
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    const blob = await canvasToPng(canvas);
    return {
      blob,
      width: dimensions.width,
      height: dimensions.height,
      filename: cardFilename(payload, options.format),
    };
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
  }
}
