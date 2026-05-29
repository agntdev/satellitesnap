import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "../types";
import {
  ESRI_REFERENCE_OVERLAY,
  ESRI_WORLD_IMAGERY,
  type ImagerySource,
} from "../services/imagery";

export interface MapViewProps {
  target: LatLng;
  zoom?: number;
  source?: ImagerySource;
  /** Fired when the base imagery tiles fail to load. */
  onTileError?: () => void;
  /** Fired once the base imagery tiles have loaded for the current view. */
  onTilesLoaded?: () => void;
  /** Fired with the current zoom level after the user zooms. */
  onZoomChange?: (zoom: number) => void;
}

/**
 * Imperative Leaflet wrapper. The map instance is created once and then
 * re-centred / re-tiled as props change, which avoids tearing down and
 * rebuilding the (expensive) map on every search.
 */
export default function MapView({
  target,
  zoom = 17,
  source = ESRI_WORLD_IMAGERY,
  onTileError,
  onTilesLoaded,
  onZoomChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  // Create the map exactly once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [target.lat, target.lng],
      zoom,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    L.tileLayer(ESRI_REFERENCE_OVERLAY.url, {
      maxZoom: ESRI_REFERENCE_OVERLAY.maxZoom,
      opacity: 0.85,
      pane: "overlayPane",
      updateWhenIdle: true,
      keepBuffer: 2,
    }).addTo(map);

    map.on("zoomend", () => onZoomChange?.(map.getZoom()));

    return () => {
      map.remove();
      mapRef.current = null;
      baseRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the base imagery layer whenever the source changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (baseRef.current) {
      map.removeLayer(baseRef.current);
    }
    const layer = L.tileLayer(source.url, {
      maxZoom: source.maxZoom,
      attribution: source.attribution,
      // Perf: fetch fewer tiles mid-gesture, keep a small off-screen buffer,
      // and cross-fade so historical-layer swaps don't flash.
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
    });
    layer.on("tileerror", () => onTileError?.());
    layer.on("load", () => onTilesLoaded?.());
    layer.addTo(map);
    baseRef.current = layer;
  }, [source, onTileError, onTilesLoaded]);

  // Re-centre and move the marker when the target changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([target.lat, target.lng], zoom);
    if (markerRef.current) {
      markerRef.current.setLatLng([target.lat, target.lng]);
    } else {
      markerRef.current = L.circleMarker([target.lat, target.lng], {
        radius: 7,
        color: "#39ff14",
        weight: 2,
        fillColor: "#39ff14",
        fillOpacity: 0.25,
      }).addTo(map);
    }
  }, [target.lat, target.lng, zoom]);

  return (
    <div
      ref={containerRef}
      className="mapview"
      role="img"
      aria-label={`satellite imagery at ${target.lat.toFixed(5)}, ${target.lng.toFixed(5)}`}
    />
  );
}
