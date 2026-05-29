/**
 * Satellite imagery tile sources.
 *
 * Esri's "World Imagery" basemap is global, high-resolution, refreshed
 * regularly, and free to use with attribution and no API key — which keeps the
 * static GitHub Pages build self-contained. Historical layers (Esri Wayback)
 * are layered on top of this in T07.
 */
export interface ImagerySource {
  id: string;
  name: string;
  /** Leaflet tile URL template. */
  url: string;
  attribution: string;
  maxZoom: number;
}

export const ESRI_WORLD_IMAGERY: ImagerySource = {
  id: "esri-world-imagery",
  name: "Esri World Imagery (latest)",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
  maxZoom: 19,
};

/** Reference labels (place names / roads) overlaid above imagery. */
export const ESRI_REFERENCE_OVERLAY: ImagerySource = {
  id: "esri-reference",
  name: "Esri Reference labels",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  attribution: "Labels &copy; Esri",
  maxZoom: 19,
};
