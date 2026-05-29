import type { Target } from "../types";

export interface ImageDisplayProps {
  target: Target | null;
  busy?: boolean;
  error?: string | null;
}

/**
 * The main imagery viewport. In T03 this is the framed, stateful container that
 * later tasks (T05 imagery, T07 time-travel) render an actual map/tiles into.
 */
export default function ImageDisplay({
  target,
  busy = false,
  error = null,
}: ImageDisplayProps) {
  return (
    <div className="window viewport">
      <div className="window__bar">
        <span className="window__dots">
          <span className="window__dot window__dot--r" />
          <span className="window__dot window__dot--y" />
          <span className="window__dot window__dot--g" />
        </span>
        <span>
          {target ? target.label : "no target acquired"}
        </span>
      </div>
      <div className="window__body viewport__body">
        {error ? (
          <p className="viewport__msg viewport__msg--error" role="alert">
            ✗ {error}
          </p>
        ) : busy ? (
          <p className="viewport__msg cursor">acquiring imagery</p>
        ) : target ? (
          <div className="viewport__coords">
            <span className="text-dim">lat</span> {target.lat.toFixed(5)}{" "}
            <span className="text-dim">lng</span> {target.lng.toFixed(5)}
          </div>
        ) : (
          <p className="viewport__msg text-dim">
            // enter an address or coordinates to pull the latest pass
          </p>
        )}
      </div>
    </div>
  );
}
