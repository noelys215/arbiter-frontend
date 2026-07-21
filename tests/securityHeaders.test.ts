import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type VercelHeader = { key: string; value: string };
type VercelConfig = {
  headers?: Array<{ source: string; headers: VercelHeader[] }>;
};

describe("production security headers", () => {
  const config = JSON.parse(
    readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
  ) as VercelConfig;
  const allRouteHeaders = config.headers?.find(
    (entry) => entry.source === "/(.*)",
  )?.headers;
  const header = (key: string) =>
    allRouteHeaders?.find((entry) => entry.key === key)?.value;

  it("sets the required browser hardening headers on every route", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("Permissions-Policy")).toContain("camera=()");
  });

  it("keeps the CSP strict while allowing current production services", () => {
    const csp = header("Content-Security-Policy");
    const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const inlineJsonLd = indexHtml.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    const jsonLdHash = inlineJsonLd
      ? `'sha256-${createHash("sha256").update(inlineJsonLd).digest("base64")}'`
      : null;

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(jsonLdHash).not.toBeNull();
    expect(csp).toContain(jsonLdHash);
    expect(csp).toContain("https://api.arbitertv.com");
    expect(csp).toContain("wss://api.arbitertv.com");
    expect(csp).toContain("https://arbiter-api.onrender.com");
    expect(csp).toContain("wss://arbiter-api.onrender.com");
    expect(csp).toContain("https://image.tmdb.org");
    expect(csp).toContain("https://va.vercel-scripts.com");
  });

  it("does not cache SPA documents while preserving asset caching", () => {
    const documentRule = config.headers?.find((entry) =>
      entry.headers.some(
        ({ key, value }) => key === "Cache-Control" && value === "no-store",
      ),
    );

    expect(documentRule?.source).toBe("/((?!assets/|.*\\.[^/]+$).*)");
    const documentPattern = new RegExp(`^${documentRule?.source}$`);
    expect(documentPattern.test("/app")).toBe(true);
    expect(documentPattern.test("/auth/magic-link/verify")).toBe(true);
    expect(documentPattern.test("/assets/index.js")).toBe(false);
    expect(documentPattern.test("/arbiter.png")).toBe(false);
  });
});
