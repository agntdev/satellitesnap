/** A WGS84 latitude/longitude pair. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** A resolved search target: coordinates plus a human-readable label. */
export interface Target extends LatLng {
  /** Display label (geocoded place name or formatted coordinates). */
  label: string;
}

/** One entry in the search history. */
export interface HistoryEntry extends Target {
  /** Unique id (stable across reloads). */
  id: string;
  /** Epoch milliseconds the search was made. */
  searchedAt: number;
}
