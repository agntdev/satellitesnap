import type { ImagerySource } from "./imagery";
import type { Target } from "../types";

/**
 * Derived imagery metadata. Satellite tiles carry no embedded EXIF, so we
 * surface the equivalent observable facts: capture/release date, source,
 * zoom level, and the ground resolution implied by the Web Mercator zoom.
 */
export interface ImageMetadata {
  label: string;
  lat: number;
  lng: number;
  source: string;
  /** Imagery release/capture date (YYYY-MM-DD), if known. */
  date?: string;
  zoom: number;
  /** Approximate ground sample distance in metres per pixel. */
  metersPerPixel: number;
  /** Human-friendly resolution string. */
  resolution: string;
}

const EARTH_CIRCUMFERENCE = 40075016.686; // metres at the equator

/** Web Mercator ground resolution (m/px) at a latitude and zoom. */
export function groundResolution(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (EARTH_CIRCUMFERENCE * Math.cos(latRad)) / Math.pow(2, zoom + 8);
}

function formatResolution(mpp: number): string {
  if (mpp < 1) return `${(mpp * 100).toFixed(0)} cm/px`;
  return `${mpp.toFixed(1)} m/px`;
}

export function buildMetadata(
  target: Target,
  source: ImagerySource | undefined,
  date: string | undefined,
  zoom: number,
): ImageMetadata {
  const mpp = groundResolution(target.lat, zoom);
  return {
    label: target.label,
    lat: target.lat,
    lng: target.lng,
    source: source?.name ?? "Esri World Imagery (latest)",
    date,
    zoom,
    metersPerPixel: mpp,
    resolution: formatResolution(mpp),
  };
}
