import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FALLBACK_RELEASES,
  fetchWaybackReleases,
  parseConfig,
  waybackSource,
} from "./wayback";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const sampleConfig = {
  "10842": {
    itemTitle: "World Imagery (Wayback 2026-05-28)",
    itemURL: "https://wayback.example/tile/10842/{level}/{row}/{col}",
  },
  "22869": {
    itemTitle: "World Imagery (Wayback 2026-03-26)",
    itemURL: "https://wayback.example/tile/22869/{level}/{row}/{col}",
  },
  bad: { itemTitle: "no date here", itemURL: "x" },
};

describe("parseConfig", () => {
  it("parses, converts templates, and sorts newest-first", () => {
    const out = parseConfig(sampleConfig as never);
    expect(out).toHaveLength(2);
    expect(out[0].date).toBe("2026-05-28");
    expect(out[1].date).toBe("2026-03-26");
    expect(out[0].url).toBe("https://wayback.example/tile/10842/{z}/{y}/{x}");
  });
});

describe("waybackSource", () => {
  it("builds a leaflet imagery source for a release", () => {
    const src = waybackSource(FALLBACK_RELEASES[0]);
    expect(src.url).toMatch(/\{z\}/);
    expect(src.id).toContain("wayback");
  });
});

describe("fetchWaybackReleases", () => {
  it("returns parsed releases on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => sampleConfig })),
    );
    const out = await fetchWaybackReleases();
    expect(out[0].date).toBe("2026-05-28");
  });

  it("falls back to the bundled list on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const out = await fetchWaybackReleases();
    expect(out).toEqual(FALLBACK_RELEASES);
  });
});
