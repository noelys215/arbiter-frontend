import { APP_VERSION } from "../../config/appMetadata";
import type { FeedbackDiagnostics, FeedbackSource } from "./feedback.api";

const INVITE_ROUTE = /^\/invite\/(friend|group)\/[^/]+(?:\/.*)?$/i;

export function sanitizeFeedbackRoute(value: string) {
  let decoded = value.trim();
  for (let index = 0; index < 2; index += 1) {
    try {
      const nextValue = decodeURIComponent(decoded);
      if (nextValue === decoded) break;
      decoded = nextValue;
    } catch {
      break;
    }
  }

  let path = decoded.split(/[?#]/, 1)[0] || "/";
  if (/^https?:\/\//i.test(decoded)) {
    try {
      path = new URL(decoded).pathname;
    } catch {
      return "/[redacted]";
    }
  }
  const match = path.match(INVITE_ROUTE);
  if (match) return `/invite/${match[1].toLowerCase()}/[redacted]`;
  return path.startsWith("/") ? path.slice(0, 180) : "/[redacted]";
}

function getBrowser(userAgent: string) {
  const browsers: Array<[RegExp, string]> = [
    [/Edg\/(\d+)/, "Edge"],
    [/Chrome\/(\d+)/, "Chrome"],
    [/Firefox\/(\d+)/, "Firefox"],
    [/Version\/(\d+).+Safari/, "Safari"],
  ];
  for (const [pattern, name] of browsers) {
    const match = userAgent.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return "Unknown browser";
}

function getOperatingSystem(userAgent: string) {
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown OS";
}

export function buildFeedbackDiagnostics(
  source: FeedbackSource,
  selectedGroupId?: string | null,
): FeedbackDiagnostics {
  const diagnostics: FeedbackDiagnostics = {
    route: sanitizeFeedbackRoute(window.location.pathname),
    browser: getBrowser(window.navigator.userAgent),
    operating_system: getOperatingSystem(window.navigator.userAgent),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    app_version: APP_VERSION,
    submitted_at: new Date().toISOString(),
    source,
    online: window.navigator.onLine,
  };
  if (selectedGroupId) diagnostics.selected_group_id = selectedGroupId;
  return diagnostics;
}
