import { useEffect, useState, type ReactNode } from "react";
import type { Target } from "../types";
import type { ImagerySource } from "../services/imagery";
import MapView from "./MapView";

export interface ImageDisplayProps {
  target: Target | null;
  busy?: boolean;
  error?: string | null;
  /** Imagery layer to render (defaults to latest Esri World Imagery). */
  source?: ImagerySource;
  /** Extra controls rendered beneath the map (e.g. the time-travel timeline). */
  footer?: ReactNode;
}

/**
 * The main imagery viewport. Hosts the Leaflet/Esri map once a target is
 * acquired and exposes empty / busy / error states otherwise.
 */
export default function ImageDisplay({
  target,
  busy = false,
  error = null,
  source,
  footer,
}: ImageDisplayProps) {
  const [tilesLoading, setTilesLoading] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Reset tile status whenever the target or imagery source changes.
  useEffect(() => {
    if (target) {
      setTilesLoading(true);
      setTileError(false);
    }
  }, [target?.lat, target?.lng, source?.id]);

  return (
    <div className="window viewport">
      <div className="window__bar">
        <span className="window__dots">
          <span className="window__dot window__dot--r" />
          <span className="window__dot window__dot--y" />
          <span className="window__dot window__dot--g" />
        </span>
        <span>{target ? target.label : "no target acquired"}</span>
      </div>

      <div className="window__body viewport__body">
        {error ? (
          <p className="viewport__msg viewport__msg--error" role="alert">
            ✗ {error}
          </p>
        ) : !target ? (
          <p className="viewport__msg text-dim">
            // enter an address or coordinates to pull the latest pass
          </p>
        ) : (
          <div className="viewport__map">
            <MapView
              target={target}
              source={source}
              onTileError={() => {
                setTileError(true);
                setTilesLoading(false);
              }}
              onTilesLoaded={() => setTilesLoading(false)}
            />
            {(busy || tilesLoading) && (
              <div className="viewport__overlay cursor">acquiring imagery</div>
            )}
            {tileError && (
              <div className="viewport__overlay viewport__overlay--error" role="alert">
                ✗ imagery tiles failed to load
              </div>
            )}
            <div className="viewport__coords">
              <span className="text-dim">lat</span> {target.lat.toFixed(5)}{" "}
              <span className="text-dim">lng</span> {target.lng.toFixed(5)}
            </div>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
