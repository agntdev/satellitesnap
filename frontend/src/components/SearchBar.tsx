import { useState, type FormEvent } from "react";

export interface SearchBarProps {
  /** Called with the raw query string when the user submits. */
  onSearch: (query: string) => void;
  /** Disables the form while a search is in flight. */
  busy?: boolean;
  /** Controlled value, so parent flows (history clicks, permalinks) can prefill. */
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({
  onSearch,
  busy = false,
  value,
  onChange,
}: SearchBarProps) {
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
        target &mdash; address or lat,lng
      </label>
      <div className="searchbar__row">
        <input
          id="search-input"
          className="input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="1600 Amphitheatre Pkwy  ·  37.4220,-122.0841"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={busy}
        />
        <button className="btn" type="submit" disabled={busy || !query.trim()}>
          {busy ? "scanning…" : "snap ⮐"}
        </button>
      </div>
    </form>
  );
}
