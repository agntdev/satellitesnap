import type { HistoryEntry } from "../types";
import { useI18n, type Locale } from "../i18n";

export interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTime(ms: number, locale: Locale): string {
  const d = new Date(ms);
  return d.toLocaleString(locale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPanel({
  entries,
  onSelect,
  onClear,
}: HistoryPanelProps) {
  const { t, locale } = useI18n();
  return (
    <aside className="window history" aria-label={t("history.aria")}>
      <div className="window__bar">
        <span>{t("history.title")}</span>
        {entries.length > 0 && (
          <button
            className="history__clear"
            type="button"
            onClick={onClear}
            aria-label={t("history.clearAria")}
          >
            {t("history.clear")}
          </button>
        )}
      </div>
      <div className="window__body history__body">
        {entries.length === 0 ? (
          <p className="text-dim history__empty">{t("history.empty")}</p>
        ) : (
          <ul className="history__list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  className="history__item"
                  type="button"
                  onClick={() => onSelect(entry)}
                  title={`${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)}`}
                >
                  <span className="history__label">{entry.label}</span>
                  <span className="history__time text-dim">
                    {formatTime(entry.searchedAt, locale)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
