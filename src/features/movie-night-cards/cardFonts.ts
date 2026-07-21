const displayFontUrl = new URL(
  "../../fonts/ITC Benguiat Book Regular.otf",
  import.meta.url,
).href;

let displayFontPromise: Promise<string | null> | null = null;

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to prepare card typography."));
    reader.readAsDataURL(blob);
  });
}

export function loadCardDisplayFont() {
  if (displayFontPromise) return displayFontPromise;
  displayFontPromise = (async () => {
    try {
      if (document.fonts) {
        await Promise.all([
          document.fonts.ready,
          document.fonts.load('48px "ITC Benguiat Book Regular"'),
        ]);
      }
      const response = await fetch(displayFontUrl);
      if (!response.ok) return null;
      return await blobToDataUrl(await response.blob());
    } catch {
      return null;
    }
  })();
  return displayFontPromise;
}

