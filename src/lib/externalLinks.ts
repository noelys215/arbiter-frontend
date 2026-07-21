const TELEPARTY_HOSTS = [
  "teleparty.com",
  "www.teleparty.com",
  "netflixparty.com",
  "www.netflixparty.com",
] as const;

const TRAILER_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
] as const;

const STREAMING_PROVIDER_HOSTS = [
  "amazon.com",
  "www.amazon.com",
  "amcplus.com",
  "www.amcplus.com",
  "crunchyroll.com",
  "www.crunchyroll.com",
  "disneyplus.com",
  "www.disneyplus.com",
  "fubo.tv",
  "www.fubo.tv",
  "hulu.com",
  "www.hulu.com",
  "max.com",
  "www.max.com",
  "play.max.com",
  "mgmplus.com",
  "www.mgmplus.com",
  "netflix.com",
  "www.netflix.com",
  "paramountplus.com",
  "www.paramountplus.com",
  "peacocktv.com",
  "www.peacocktv.com",
  "pluto.tv",
  "www.pluto.tv",
  "primevideo.com",
  "www.primevideo.com",
  "sling.com",
  "www.sling.com",
  "starz.com",
  "www.starz.com",
  "tubitv.com",
  "www.tubitv.com",
  "tv.apple.com",
  "tv.youtube.com",
  "youtube.com",
  "www.youtube.com",
] as const;

export function normalizeExternalHttpsUrl(
  value: string | null | undefined,
  allowedHosts: readonly string[],
) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    const allowedHostSet = new Set(allowedHosts);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      !allowedHostSet.has(url.hostname.toLowerCase())
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeTelepartyUrl(value: string | null | undefined) {
  return normalizeExternalHttpsUrl(value, TELEPARTY_HOSTS);
}

export function normalizeTrailerUrl(value: string | null | undefined) {
  return normalizeExternalHttpsUrl(value, TRAILER_HOSTS);
}

export function normalizeStreamingProviderUrl(
  value: string | null | undefined,
) {
  return normalizeExternalHttpsUrl(value, STREAMING_PROVIDER_HOSTS);
}
