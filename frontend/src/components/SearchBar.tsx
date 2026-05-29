import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n";

export interface SearchBarProps {
  /** Called with the raw query string when the user submits. */
  onSearch: (query: string) => void;
  /** Disables the form while a search is in flight. */
  busy?: boolean;
  /** Controlled value, so parent flows (history clicks, permalinks) can prefill. */
  value?: string;
  onChange?: (value: string) => void;
  /** Invoked when the user asks to use their current location. */
  onLocate?: () => void;
}

export default function SearchBar({
  onSearch,
  busy = false,
  value,
  onChange,
  onLocate,
}: SearchBarProps) {
  const { t } = useI18n();
  const [internal, setInternal] = useState("");
  const controlled = value !== undefined;
  const query = controlled ? value : internal;

  function setQuery(next: string) {
    if (controlled) onChange?.(next);
    else setInternal(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || busy) return;
    onSearch(trimmed);
  }

  return (
    <form className="searchbar" onSubmit={handleSubmit} role="search">
      <label className="label" htmlFor="search-input">
        {t("search.label")}
      </label>
      <div className="searchbar__row">
        <input
          id="search-input"
          className="input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={busy}
        />
        {onLocate && (
          <button
            className="btn searchbar__locate"
            type="button"
            onClick={onLocate}
            disabled={busy}
            aria-label={t("search.locate")}
            title={t("search.locate")}
          >
            ⌖
          </button>
        )}
        <button className="btn" type="submit" disabled={busy || !query.trim()}>
          {busy ? t("search.scanning") : t("search.submit")}
        </button>
      </div>
    </form>
  );
}
