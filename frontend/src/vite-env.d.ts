/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the SatelliteSnap backend API. Empty on static (GitHub Pages) builds. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
