import type { Target } from "../types";

/**
 * Resolve a user query to a geographic target.
 *
 * Two input modes are supported:
 *  1. Raw coordinates: "lat,lng" (also tolerates whitespace and a leading "@").
 *  2. Free-text address / place name, resolved via the OpenStreetMap
 *     Nominatim API — no API key required, which keeps the static GitHub Pages
 *     build fully self-contained.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export class GeocodeError extends Error {}

const COORD_RE = /^\s*@?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

/** Try to interpret the query as literal coordinates. Returns null if it isn't. */
export function parseCoordinates(query: string): Target | null {
  const m = query.match(COORD_RE);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Geocode a free-text address via Nominatim. */
async function geocodeAddress(
  query: string,
  signal?: AbortSignal,
): Promise<Target> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=jsonv2&limit=1&addressdetails=0`;

  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new GeocodeError("network error while geocoding — check connection");
  }

  if (!res.ok) {
    throw new GeocodeError(`geocoder returned ${res.status}`);
  }

  const data = (await res.json()) as NominatimResult[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new GeocodeError(`no match for "${query}"`);
  }

  const top = data[0];
  const lat = Number(top.lat);
  const lng = Number(top.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new GeocodeError("geocoder returned malformed coordinates");
  }
  return { lat, lng, label: top.display_name || query };
}

/**
 * Resolve any query (coordinates or address) to a {@link Target}.
 * @throws {GeocodeError} on empty input, no match, or upstream failure.
 */
// Cache resolved addresses for the session so repeat lookups (history clicks,
// re-searching the same place) are instant and don't re-hit Nominatim, whose
// usage policy discourages redundant requests.
const addressCache = new Map<string, Target>();

export function _clearGeocodeCache(): void {
  addressCache.clear();
}

export async function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<Target> {
  const trimmed = query.trim();
  if (!trimmed) throw new GeocodeError("enter an address or coordinates");

  const coords = parseCoordinates(trimmed);
  if (coords) return coords;

  const key = trimmed.toLowerCase();
  const cached = addressCache.get(key);
  if (cached) return cached;

  const result = await geocodeAddress(trimmed, signal);
  addressCache.set(key, result);
  return result;
}
