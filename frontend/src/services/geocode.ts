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

/** Stable, locale-independent reason a geocode failed. */
export type GeocodeErrorCode =
  | "empty"
  | "noMatch"
  | "network"
  | "http"
  | "malformed";

/**
 * A geocoding failure. Carries a stable {@link GeocodeErrorCode} plus
 * optional interpolation params so the UI can render a localized message
 * (the English `message` is kept as a fallback for logs/tests).
 */
export class GeocodeError extends Error {
  readonly code: GeocodeErrorCode;
  readonly params?: Record<string, string | number>;

  constructor(
    code: GeocodeErrorCode,
    message: string,
    params?: Record<string, string | number>,
  ) {
    super(message);
    this.name = "GeocodeError";
    this.code = code;
    this.params = params;
  }
}

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

const PHOTON_URL = "https://photon.komoot.io/api/";

/** A ranked candidate location for the autocomplete dropdown. */
export interface Suggestion extends Target {
  /** Coarse category hint (e.g. "city", "road") shown in the dropdown. */
  kind?: string;
  /** Provider relevance; higher is better. Used to rank candidates. */
  score?: number;
}

/** Preferred result language — biases Nominatim/Photon toward the UI locale. */
function preferredLang(): string {
  return typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en";
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  addresstype?: string;
  type?: string;
}

/** Fetch + parse JSON, normalising transport/HTTP failures to GeocodeError. */
async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new GeocodeError(
      "network",
      "network error while geocoding — check connection",
    );
  }
  if (!res.ok) {
    throw new GeocodeError("http", `geocoder returned ${res.status}`, {
      status: res.status,
    });
  }
  return res.json();
}

function asSuggestion(
  lat: number,
  lng: number,
  label: string,
  extra?: { kind?: string; score?: number },
): Suggestion | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label, ...extra };
}

/** Primary provider: OpenStreetMap Nominatim. Returns ranked candidates. */
async function searchNominatim(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<Suggestion[]> {
  const url =
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}` +
    `&format=jsonv2&limit=${limit}&addressdetails=0` +
    `&accept-language=${encodeURIComponent(preferredLang())}`;
  const data = await fetchJson(url, signal);
  if (!Array.isArray(data)) return [];
  return (data as NominatimResult[])
    .map((r) =>
      asSuggestion(Number(r.lat), Number(r.lon), r.display_name || query, {
        kind: r.addresstype || r.type,
        score: typeof r.importance === "number" ? r.importance : 0,
      }),
    )
    .filter((s): s is Suggestion => s !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string | undefined>;
}

function photonLabel(p: Record<string, string | undefined> = {}): string {
  return [p.name, p.street, p.city, p.state, p.country]
    .filter(Boolean)
    .join(", ");
}

/** Secondary, typo-tolerant provider: Komoot Photon. */
async function searchPhoton(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<Suggestion[]> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
  const data = await fetchJson(url, signal);
  const features = (data as { features?: PhotonFeature[] })?.features;
  if (!Array.isArray(features)) return [];
  return features
    .map((f) => {
      const c = f.geometry?.coordinates;
      if (!c || c.length < 2) return null;
      return asSuggestion(Number(c[1]), Number(c[0]), photonLabel(f.properties) || query, {
        kind: f.properties?.osm_value || f.properties?.type,
      });
    })
    .filter((s): s is Suggestion => s !== null);
}

/**
 * Progressively broadened variants of a query, used as fallbacks when the
 * exact phrasing finds nothing: drop a leading house number, then peel off
 * leading comma-separated segments ("12a Foo St, Bar, Baz" → "Bar, Baz" → "Baz").
 */
export function relaxedQueries(query: string): string[] {
  const out: string[] = [];
  const push = (q: string) => {
    const v = q.trim();
    if (v && v !== query && !out.includes(v)) out.push(v);
  };

  push(query.replace(/^\s*\d+[a-z]?\s+/i, "")); // strip leading house number
  const parts = query.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = 1; i < parts.length; i++) push(parts.slice(i).join(", "));
  return out;
}

// Session caches: resolved targets and suggestion lists. Keep repeat lookups
// instant and respect Nominatim's "don't hammer us" usage policy.
const addressCache = new Map<string, Target>();
const suggestionCache = new Map<string, Suggestion[]>();

export function _clearGeocodeCache(): void {
  addressCache.clear();
  suggestionCache.clear();
}

/**
 * Best-effort ranked candidates for the autocomplete dropdown. Never throws
 * except on abort — a provider hiccup just yields fewer (or no) suggestions.
 */
export async function suggest(
  query: string,
  signal?: AbortSignal,
  limit = 5,
): Promise<Suggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const coords = parseCoordinates(trimmed);
  if (coords) return [{ ...coords }];

  const cacheKey = `${limit}:${trimmed.toLowerCase()}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached) return cached;

  let results = await safe(() => searchNominatim(trimmed, limit, signal));
  if (!results.length) {
    for (const alt of relaxedQueries(trimmed)) {
      results = await safe(() => searchNominatim(alt, limit, signal));
      if (results.length) break;
    }
  }
  if (!results.length) {
    results = await safe(() => searchPhoton(trimmed, limit, signal));
  }

  if (results.length) suggestionCache.set(cacheKey, results);
  return results;
}

/** Run a provider call, swallowing GeocodeErrors (but never AbortError). */
async function safe(fn: () => Promise<Suggestion[]>): Promise<Suggestion[]> {
  try {
    return await fn();
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    return [];
  }
}

/**
 * Resolve any query (coordinates or address) to a single best {@link Target}.
 *
 * Resolution order: literal coordinates → cached result → Nominatim (exact) →
 * Nominatim (progressively relaxed) → Photon (typo-tolerant). Transport/HTTP
 * failures from the primary provider propagate; only a genuine empty result
 * across every provider yields a `noMatch` error.
 *
 * @throws {GeocodeError} on empty input, no match, or upstream failure.
 */
export async function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<Target> {
  const trimmed = query.trim();
  if (!trimmed)
    throw new GeocodeError("empty", "enter an address or coordinates");

  const coords = parseCoordinates(trimmed);
  if (coords) return coords;

  const key = trimmed.toLowerCase();
  const cached = addressCache.get(key);
  if (cached) return cached;

  let results = await searchNominatim(trimmed, 5, signal);
  if (!results.length) {
    for (const alt of relaxedQueries(trimmed)) {
      results = await searchNominatim(alt, 5, signal);
      if (results.length) break;
    }
  }
  if (!results.length) {
    results = await safe(() => searchPhoton(trimmed, 5, signal));
  }
  if (!results.length) {
    throw new GeocodeError("noMatch", `no match for "${query}"`, { query });
  }

  const best = results[0];
  const target: Target = { lat: best.lat, lng: best.lng, label: best.label };
  addressCache.set(key, target);
  return target;
}
