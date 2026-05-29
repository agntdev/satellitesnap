import { useState } from "react";
import SearchBar from "./components/SearchBar";
import ImageDisplay from "./components/ImageDisplay";
import HistoryPanel from "./components/HistoryPanel";
import type { HistoryEntry, Target } from "./types";

/**
 * Parse a "lat,lng" string into coordinates, or return null. Real geocoding of
 * free-text addresses lands in T04 — for now coordinate input works directly.
 */
function parseLatLng(input: string): Target | null {
  const m = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
}

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `h${Date.now()}-${idSeq}`;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  function commitTarget(next: Target) {
    setTarget(next);
    setError(null);
    setHistory((prev) => {
      const entry: HistoryEntry = {
        ...next,
        id: nextId(),
        searchedAt: Date.now(),
      };
      // Drop any existing entry for the same spot, newest first, cap at 20.
      const deduped = prev.filter(
        (e) => e.lat !== next.lat || e.lng !== next.lng,
      );
      return [entry, ...deduped].slice(0, 20);
    });
  }

  function handleSearch(raw: string) {
    const parsed = parseLatLng(raw);
    if (!parsed) {
      setError(
        "address geocoding arrives in a later build — enter coordinates as lat,lng for now",
      );
      return;
    }
    commitTarget(parsed);
  }

  function handleSelect(entry: HistoryEntry) {
    setQuery(entry.label);
    commitTarget({ lat: entry.lat, lng: entry.lng, label: entry.label });
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          <span className="app__prompt">$</span>
          <span className="cursor">satellitesnap</span>
        </h1>
        <p className="app__tagline">
          freshest satellite imagery for any address or coordinates
        </p>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
      />

      <section className="app__body">
        <ImageDisplay target={target} error={error} />
        <HistoryPanel
          entries={history}
          onSelect={handleSelect}
          onClear={() => setHistory([])}
        />
      </section>
    </main>
  );
}
