import { afterEach, describe, expect, it, vi } from "vitest";
import {
  _clearGeocodeCache,
  geocode,
  relaxedQueries,
  suggest,
} from "./geocode";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  _clearGeocodeCache();
});

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

/** Read the `q` query param out of a request URL. */
function qOf(url: string): string {
  return new URL(url).searchParams.get("q") ?? "";
}

const nominatimHit = (
  display: string,
  lat: number,
  lon: number,
  importance: number,
) => ({ lat: String(lat), lon: String(lon), display_name: display, importance });

const photonResponse = {
  features: [
    {
      geometry: { coordinates: [37.6173, 55.7558] },
      properties: { name: "Москва", country: "Россия", osm_value: "city" },
    },
  ],
};

describe("relaxedQueries", () => {
  it("strips a leading house number, then peels comma segments", () => {
    expect(relaxedQueries("12a Foo St, Bar, Baz")).toEqual([
      "Foo St, Bar, Baz",
      "Bar, Baz",
      "Baz",
    ]);
  });

  it("returns nothing to relax for a single bare token", () => {
    expect(relaxedQueries("oslo")).toEqual([]);
  });
});

describe("suggest", () => {
  it("returns the coordinate itself without any network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const out = await suggest("48.8584, 2.2945");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ lat: 48.8584, lng: 2.2945 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ranks Nominatim candidates by importance, highest first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ok([
          nominatimHit("Springfield, IL", 39.8, -89.6, 0.4),
          nominatimHit("Springfield, MA", 42.1, -72.6, 0.8),
        ]),
      ),
    );
    const out = await suggest("springfield");
    expect(out.map((s) => s.label)).toEqual([
      "Springfield, MA",
      "Springfield, IL",
    ]);
  });

  it("falls back to a relaxed query when the exact phrasing finds nothing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("nominatim")) {
          return ok(qOf(url) === "Nowhere" ? [nominatimHit("Nowhere", 1, 2, 0.5)] : []);
        }
        return ok({ features: [] });
      }),
    );
    const out = await suggest("12 Foo St, Nowhere");
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("Nowhere");
  });

  it("falls back to Photon (typo-tolerant) when Nominatim is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("nominatim") ? ok([]) : ok(photonResponse),
      ),
    );
    const out = await suggest("москава"); // misspelled Moscow
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ lat: 55.7558, lng: 37.6173, label: "Москва, Россия" });
  });

  it("never throws on a provider error — returns an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );
    await expect(suggest("anywhere")).resolves.toEqual([]);
  });
});

describe("geocode fallbacks", () => {
  it("resolves via Photon when Nominatim has no match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("nominatim") ? ok([]) : ok(photonResponse),
      ),
    );
    const t = await geocode("москава");
    expect(t).toMatchObject({ lat: 55.7558, lng: 37.6173, label: "Москва, Россия" });
  });

  it("resolves via a relaxed query when the exact address misses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("nominatim")) {
          return ok(qOf(url) === "Paris" ? [nominatimHit("Paris, France", 48.85, 2.35, 0.9)] : []);
        }
        return ok({ features: [] });
      }),
    );
    const t = await geocode("999 Imaginary Rd, Paris");
    expect(t.label).toBe("Paris, France");
  });
});
