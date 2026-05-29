import type { ImagerySource } from "./imagery";

/**
 * Esri "Wayback" imagery — every published revision of the World Imagery
 * basemap, addressable by release. This powers the time-travel feature: each
 * release is a historical snapshot, selectable by date.
 *
 * The catalogue of releases is published as a CORS-enabled JSON config (no API
 * key), so the static build can fetch it directly. A small bundled fallback is
 * used if that request fails.
 */

const CONFIG_URL =
  "https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json";

export interface WaybackRelease {
  releaseNum: number;
  /** ISO date (YYYY-MM-DD) of the imagery release. */
  date: string;
  /** Leaflet-ready XYZ tile template. */
  url: string;
}

interface ConfigEntry {
  itemTitle?: string;
  itemURL?: string;
}

/** Convert a WMTS {level}/{row}/{col} template to Leaflet's {z}/{y}/{x}. */
function toLeafletTemplate(url: string): string {
  return url
    .replace("{level}", "{z}")
    .replace("{row}", "{y}")
    .replace("{col}", "{x}");
}

function parseDate(title: string): string | null {
  const m = title.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** A few known-good releases used if the live catalogue can't be fetched. */
export const FALLBACK_RELEASES: WaybackRelease[] = [
  {
    releaseNum: 10842,
    date: "2026-05-28",
    url: "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/10842/{z}/{y}/{x}",
  },
  {
    releaseNum: 49059,
    date: "2026-04-30",
    url: "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/49059/{z}/{y}/{x}",
  },
  {
    releaseNum: 22869,
    date: "2026-03-26",
    url: "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/22869/{z}/{y}/{x}",
  },
];

/** Parse the raw Wayback config into a date-descending list of releases. */
export function parseConfig(raw: Record<string, ConfigEntry>): WaybackRelease[] {
  const releases: WaybackRelease[] = [];
  for (const [key, entry] of Object.entries(raw)) {
    const releaseNum = Number(key);
    if (!Number.isFinite(releaseNum) || !entry.itemTitle || !entry.itemURL) {
      continue;
    }
    const date = parseDate(entry.itemTitle);
    if (!date) continue;
    releases.push({ releaseNum, date, url: toLeafletTemplate(entry.itemURL) });
  }
  // Newest first.
  releases.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return releases;
}

const CACHE_KEY = "satellitesnap.wayback.v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function readCache(now: number): WaybackRelease[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, releases } = JSON.parse(raw) as {
      at: number;
      releases: WaybackRelease[];
    };
    if (now - at > CACHE_TTL_MS || !Array.isArray(releases) || !releases.length) {
      return null;
    }
    return releases;
  } catch {
    return null;
  }
}

function writeCache(now: number, releases: WaybackRelease[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: now, releases }));
  } catch {
    /* storage unavailable — caching is best-effort */
  }
}

/**
 * Fetch the live Wayback catalogue, falling back to the bundled list. Results
 * are cached in localStorage for a day so repeat visits skip the (large)
 * catalogue download entirely.
 */
export async function fetchWaybackReleases(
  signal?: AbortSignal,
  now: number = Date.now(),
): Promise<WaybackRelease[]> {
  const cached = readCache(now);
  if (cached) return cached;
  try {
    const res = await fetch(CONFIG_URL, { signal });
    if (!res.ok) throw new Error(`wayback config ${res.status}`);
    const parsed = parseConfig(await res.json());
    const releases = parsed.length > 0 ? parsed : FALLBACK_RELEASES;
    writeCache(now, releases);
    return releases;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    return FALLBACK_RELEASES;
  }
}

/** Build an {@link ImagerySource} for a specific historical release. */
export function waybackSource(release: WaybackRelease): ImagerySource {
  return {
    id: `wayback-${release.releaseNum}`,
    name: `Wayback ${release.date}`,
    url: release.url,
    attribution:
      'Imagery &copy; <a href="https://www.esri.com/">Esri</a> Wayback, Maxar',
    maxZoom: 19,
  };
}
