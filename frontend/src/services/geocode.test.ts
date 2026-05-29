import { afterEach, describe, expect, it, vi } from "vitest";
import {
  _clearGeocodeCache,
  geocode,
  GeocodeError,
  parseCoordinates,
} from "./geocode";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  _clearGeocodeCache();
});

describe("parseCoordinates", () => {
  it("parses lat,lng", () => {
    expect(parseCoordinates("37.4220,-122.0841")).toEqual({
      lat: 37.422,
      lng: -122.0841,
      label: "37.42200, -122.08410",
    });
  });

  it("tolerates whitespace and a leading @", () => {
    expect(parseCoordinates(" @ 51.5, -0.12 ")?.lat).toBe(51.5);
  });

  it("rejects out-of-range and non-coordinate input", () => {
    expect(parseCoordinates("91,0")).toBeNull();
    expect(parseCoordinates("oslo")).toBeNull();
  });
});

describe("geocode", () => {
  it("returns coordinates directly without a network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const t = await geocode("48.8584,2.2945");
    expect(t.lat).toBeCloseTo(48.8584);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("geocodes a free-text address via Nominatim", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { lat: "59.9133", lon: "10.7389", display_name: "Oslo, Norway" },
        ],
      })),
    );
    const t = await geocode("oslo");
    expect(t).toMatchObject({ lat: 59.9133, lng: 10.7389, label: "Oslo, Norway" });
  });

  it("throws GeocodeError when there is no match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => [] })),
    );
    await expect(geocode("zzzzzzz nowhere")).rejects.toBeInstanceOf(
      GeocodeError,
    );
  });

  it("throws GeocodeError on an HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    await expect(geocode("oslo")).rejects.toBeInstanceOf(GeocodeError);
  });

  it("rejects empty input", async () => {
    await expect(geocode("   ")).rejects.toBeInstanceOf(GeocodeError);
  });

  it("caches address lookups so repeats skip the network", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => [
        { lat: "59.9133", lon: "10.7389", display_name: "Oslo, Norway" },
      ],
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const a = await geocode("Oslo");
    const b = await geocode("  oslo  "); // different casing/spacing
    expect(b).toEqual(a);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
