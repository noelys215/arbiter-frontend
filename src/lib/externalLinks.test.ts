import { describe, expect, it } from "vitest";
import {
  normalizeExternalHttpsUrl,
  normalizeStreamingProviderUrl,
  normalizeTelepartyUrl,
  normalizeTrailerUrl,
} from "./externalLinks";

describe("external link normalization", () => {
  it("allows approved HTTPS destinations", () => {
    expect(
      normalizeTelepartyUrl(" https://www.teleparty.com/join/room "),
    ).toBe("https://www.teleparty.com/join/room");
    expect(normalizeTrailerUrl("https://youtu.be/trailer-id")).toBe(
      "https://youtu.be/trailer-id",
    );
    expect(
      normalizeStreamingProviderUrl("https://www.netflix.com/title/123"),
    ).toBe("https://www.netflix.com/title/123");
    expect(
      normalizeStreamingProviderUrl("https://tv.youtube.com/browse/channel"),
    ).toBe("https://tv.youtube.com/browse/channel");
  });

  it("requires an exact approved host", () => {
    expect(
      normalizeTelepartyUrl("https://www.teleparty.com.attacker.example/join/room"),
    ).toBeNull();
    expect(normalizeTrailerUrl("https://notyoutube.com/watch/123")).toBeNull();
    expect(
      normalizeStreamingProviderUrl("https://netflix.com.attacker.example/title/123"),
    ).toBeNull();
  });

  it("rejects unsafe protocols, credentials, and custom ports", () => {
    expect(normalizeTelepartyUrl("http://www.teleparty.com/join/room")).toBeNull();
    expect(normalizeTrailerUrl("javascript:alert(1)")).toBeNull();
    expect(
      normalizeExternalHttpsUrl("https://user@example.com/path", ["example.com"]),
    ).toBeNull();
    expect(
      normalizeExternalHttpsUrl("https://example.com:8443/path", ["example.com"]),
    ).toBeNull();
  });
});
