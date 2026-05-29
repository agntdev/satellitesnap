import type { WaybackRelease } from "../services/wayback";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="timetravel timetravel--loading text-dim cursor">
        {t("timetravel.loading")}
      </div>
    );
  }
  if (releases.length === 0) return null;

  const max = releases.length - 1;
  const clamped = Math.min(Math.max(index, 0), max);
  const current = releases[clamped];
  const isLatest = clamped === 0;

  return (
    <div className="timetravel" role="group" aria-label={t("timetravel.group")}>
      <div className="timetravel__head">
        <span className="label">{t("timetravel.label")}</span>
        <span className="timetravel__date text-accent">
          {current.date}
          {isLatest && (
            <span className="timetravel__badge">{t("timetravel.latest")}</span>
          )}
        </span>
      </div>
      <div className="timetravel__row">
        <button
          className="btn timetravel__step"
          type="button"
          onClick={() => onChange(clamped - 1)}
          disabled={clamped <= 0}
          aria-label={t("timetravel.newer")}
        >
          ◂
        </button>
        <input
          className="timetravel__slider"
          type="range"
          min={0}
          max={max}
          value={clamped}
          aria-label={t("timetravel.release")}
          aria-valuetext={current.date}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button
          className="btn timetravel__step"
          type="button"
          onClick={() => onChange(clamped + 1)}
          disabled={clamped >= max}
          aria-label={t("timetravel.older")}
        >
          ▸
        </button>
      </div>
      <p className="timetravel__hint text-dim">
        {t("timetravel.hint", {
          count: releases.length,
          from: releases[max].date,
          to: releases[0].date,
        })}
      </p>
    </div>
  );
}
