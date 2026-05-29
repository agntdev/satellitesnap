/**
 * English locale — the canonical key set.
 *
 * `ru` is typed as `Record<keyof typeof en, string>`, so the compiler
 * (and the i18n parity test) guarantees every key here has a Russian
 * counterpart. `{name}` tokens are interpolated by `translate()`.
 */
export const en = {
  "tagline": "freshest satellite imagery for any address or coordinates",

  "lang.label": "language",
  "lang.en": "EN",
  "lang.ru": "RU",

  "search.label": "target — address or lat,lng",
  "search.placeholder": "1600 Amphitheatre Pkwy  ·  37.4220,-122.0841",
  "search.locate": "use my location",
  "search.submit": "snap ⮐",
  "search.scanning": "scanning…",
  "search.suggestions": "address suggestions",

  "status.acquiring": "acquiring imagery…",
  "status.target": "target: {label}",

  "viewport.noTarget": "no target acquired",
  "viewport.empty": "// enter an address or coordinates to pull the latest pass",
  "viewport.acquiring": "acquiring imagery",
  "viewport.mapEngine": "loading map engine",
  "viewport.tileError": "✗ imagery tiles failed to load",
  "viewport.lat": "lat",
  "viewport.lng": "lng",

  "history.title": "history",
  "history.aria": "search history",
  "history.clear": "clear",
  "history.clearAria": "clear history",
  "history.empty": "// no recent scans",

  "metadata.toggle": "metadata",
  "metadata.location": "location",
  "metadata.latlng": "lat,lng",
  "metadata.source": "source",
  "metadata.date": "date",
  "metadata.zoom": "zoom",
  "metadata.resolution": "resolution",
  "metadata.latest": "latest available",

  "timetravel.label": "time-travel",
  "timetravel.group": "time travel",
  "timetravel.loading": "loading imagery timeline",
  "timetravel.latest": " · latest",
  "timetravel.newer": "newer imagery",
  "timetravel.older": "older imagery",
  "timetravel.release": "imagery release",
  "timetravel.hint": "{count} releases · {from} → {to}",

  "share.copy": "share ⎘",
  "share.copied": "link copied ✓",
  "share.aria": "copy shareable link",

  "footer.imagery": "imagery: Esri World Imagery + Wayback",
  "footer.geocoding": "geocoding: OpenStreetMap Nominatim",
  "footer.source": "source",

  "error.empty": "enter an address or coordinates",
  "error.noMatch": 'no match for "{query}"',
  "error.network": "network error while geocoding — check connection",
  "error.http": "geocoder returned {status}",
  "error.malformed": "geocoder returned malformed coordinates",
  "error.unexpected": "unexpected error while resolving location",
  "error.noGeolocation": "geolocation is not available in this browser",
  "error.geoDenied": "location permission denied",
  "error.geoFailed": "could not determine your location",
} as const;

export type TranslationKey = keyof typeof en;
