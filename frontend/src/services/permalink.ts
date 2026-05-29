import type { Target } from "../types";

/**
 * Shareable permalinks.
 *
 * State lives entirely in the URL query string, so a link fully reconstructs a
 * view with no server involvement — which works for the static GitHub Pages
 * build. Encoded params: `q` (label), `ll` (lat,lng), and optional `d`
 * (imagery release date).
 */

export interface PermalinkState {
  target: Target;
  /** Selected imagery release date (YYYY-MM-DD), if any. */
  date?: string;
}

/** Build the query string (without a leading `?`) for a view. */
export function encodePermalink(state: PermalinkState): string {
  const { target, date } = state;
  const params = new URLSearchParams();
  params.set("ll", `${target.lat.toFixed(6)},${target.lng.toFixed(6)}`);
  if (target.label) params.set("q", target.label);
  if (date) params.set("d", date);
  return params.toString();
}

/** Build an absolute shareable URL for a view. */
export function buildShareUrl(state: PermalinkState, base: string): string {
  const [origin] = base.split("?");
  return `${origin}?${encodePermalink(state)}`;
}

/** Parse a query string back into view state, or null if no usable target. */
export function parsePermalink(search: string): PermalinkState | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const ll = params.get("ll");
  if (!ll) return null;
  const m = ll.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const label = params.get("q") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const date = params.get("d") ?? undefined;
  return { target: { lat, lng, label }, date };
}
