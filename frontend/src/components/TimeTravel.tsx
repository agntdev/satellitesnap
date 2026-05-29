import type { WaybackRelease } from "../services/wayback";

export interface TimeTravelProps {
  releases: WaybackRelease[];
  /** Index into `releases` (0 = newest). */
  index: number;
  onChange: (index: number) => void;
  loading?: boolean;
}

/**
 * Timeline control for stepping through historical imagery releases. The slider
 * runs newest→oldest left→right; the prev/next buttons nudge one release.
 */
export default function TimeTravel({
  releases,
  index,
  onChange,
  loading = false,
}: TimeTravelProps) {
  if (loading) {
    return (
      <div className="timetravel timetravel--loading text-dim cursor">
        loading imagery timeline
      </div>
    );
  }
  if (releases.length === 0) return null;

  const max = releases.length - 1;
  const clamped = Math.min(Math.max(index, 0), max);
  const current = releases[clamped];
  const isLatest = clamped === 0;

  return (
    <div className="timetravel" role="group" aria-label="time travel">
      <div className="timetravel__head">
        <span className="label">time-travel</span>
        <span className="timetravel__date text-accent">
          {current.date}
          {isLatest && <span className="timetravel__badge"> · latest</span>}
        </span>
      </div>
      <div className="timetravel__row">
        <button
          className="btn timetravel__step"
          type="button"
          onClick={() => onChange(clamped - 1)}
          disabled={clamped <= 0}
          aria-label="newer imagery"
        >
          ◂
        </button>
        <input
          className="timetravel__slider"
          type="range"
          min={0}
          max={max}
          value={clamped}
          aria-label="imagery release"
          aria-valuetext={current.date}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button
          className="btn timetravel__step"
          type="button"
          onClick={() => onChange(clamped + 1)}
          disabled={clamped >= max}
          aria-label="older imagery"
        >
          ▸
        </button>
      </div>
      <p className="timetravel__hint text-dim">
        {releases.length} releases · {releases[max].date} → {releases[0].date}
      </p>
    </div>
  );
}
