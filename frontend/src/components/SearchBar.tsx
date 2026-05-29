import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useI18n } from "../i18n";
import { suggest, type Suggestion } from "../services/geocode";

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
  /**
   * When provided, the bar shows a live autocomplete dropdown and calls
   * `onPick` with an already-resolved suggestion (no re-geocode needed).
   * Omitting it keeps the bar a plain submit-only search box.
   */
  onPick?: (target: Suggestion) => void;
}

/** Don't query the suggestion API for trivially short fragments. */
const MIN_SUGGEST_LEN = 3;
const DEBOUNCE_MS = 250;

export default function SearchBar({
  onSearch,
  busy = false,
  value,
  onChange,
  onLocate,
  onPick,
}: SearchBarProps) {
  const { t } = useI18n();
  const [internal, setInternal] = useState("");
  const controlled = value !== undefined;
  const query = controlled ? value : internal;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Tidy up any pending debounce / in-flight request on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  function setQuery(next: string) {
    if (controlled) onChange?.(next);
    else setInternal(next);
  }

  function closeSuggestions() {
    setOpen(false);
    setActive(-1);
  }

  function fetchSuggestions(raw: string) {
    if (!onPick) return;
    const q = raw.trim();
    if (q.length < MIN_SUGGEST_LEN) {
      abortRef.current?.abort();
      setSuggestions([]);
      closeSuggestions();
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      suggest(q, controller.signal)
        .then((list) => {
          if (controller.signal.aborted) return;
          setSuggestions(list);
          setActive(-1);
          setOpen(list.length > 0);
        })
        .catch(() => {
          /* aborted or provider hiccup — leave the box as-is */
        });
    }, DEBOUNCE_MS);
  }

  function handleInput(next: string) {
    setQuery(next);
    fetchSuggestions(next);
  }

  function pick(s: Suggestion) {
    abortRef.current?.abort();
    setQuery(s.label);
    setSuggestions([]);
    closeSuggestions();
    if (onPick) onPick(s);
    else onSearch(s.label);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (open && active >= 0 && suggestions[active]) {
      pick(suggestions[active]);
      return;
    }
    const trimmed = query.trim();
    if (!trimmed || busy) return;
    closeSuggestions();
    onSearch(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!onPick) return;
    if (e.key === "ArrowDown") {
      if (!open && suggestions.length) {
        setOpen(true);
        return;
      }
      if (suggestions.length) {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, suggestions.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      if (open && suggestions.length) {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
    } else if (e.key === "Escape") {
      closeSuggestions();
    }
  }

  const listboxId = "search-suggestions";
  const showList = Boolean(onPick) && open && suggestions.length > 0;

  return (
    <form className="searchbar" onSubmit={handleSubmit} role="search">
      <label className="label" htmlFor="search-input">
        {t("search.label")}
      </label>
      <div className="searchbar__row">
        {/* ARIA 1.1 combobox: the role lives on the wrapper so the input
            keeps its native textbox role for assistive tech and tests. */}
        <div
          className="searchbar__combo"
          role={onPick ? "combobox" : undefined}
          aria-expanded={onPick ? showList : undefined}
          aria-owns={onPick ? listboxId : undefined}
          aria-haspopup={onPick ? "listbox" : undefined}
        >
          <input
            id="search-input"
            className="input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => window.setTimeout(closeSuggestions, 120)}
            disabled={busy}
            aria-controls={onPick ? listboxId : undefined}
            aria-autocomplete={onPick ? "list" : undefined}
            aria-activedescendant={
              showList && active >= 0 ? `${listboxId}-${active}` : undefined
            }
          />
          {showList && (
            <ul
              className="searchbar__suggestions"
              id={listboxId}
              role="listbox"
              aria-label={t("search.suggestions")}
            >
              {suggestions.map((s, i) => (
                <li
                  key={`${s.lat},${s.lng},${i}`}
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`searchbar__suggestion${
                    i === active ? " is-active" : ""
                  }`}
                  // Keep focus on the input so onBlur doesn't close before click.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(s)}
                >
                  <span className="searchbar__suggestion-label">{s.label}</span>
                  {s.kind && (
                    <span className="searchbar__suggestion-kind text-dim">
                      {s.kind}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
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
