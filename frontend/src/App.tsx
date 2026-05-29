import { useRef, useState } from "react";
import SearchBar from "./components/SearchBar";
import ImageDisplay from "./components/ImageDisplay";
import HistoryPanel from "./components/HistoryPanel";
import { geocode, GeocodeError } from "./services/geocode";
import type { HistoryEntry, Target } from "./types";

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `h${Date.now()}-${idSeq}`;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  function recordTarget(next: Target) {
    setHistory((prev) => {
      const entry: HistoryEntry = {
        ...next,
        id: nextId(),
        searchedAt: Date.now(),
      };
      const deduped = prev.filter(
        (e) => e.lat !== next.lat || e.lng !== next.lng,
      );
      return [entry, ...deduped].slice(0, 20);
    });
  }

  async function handleSearch(raw: string) {
    // Cancel any in-flight geocode so stale results can't clobber a newer one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBusy(true);
    setError(null);
    try {
      const next = await geocode(raw, controller.signal);
      if (controller.signal.aborted) return;
      setTarget(next);
      recordTarget(next);
    } catch (err) {
      if (controller.signal.aborted || (err as Error).name === "AbortError") {
        return;
      }
      setError(
        err instanceof GeocodeError
          ? err.message
          : "unexpected error while resolving location",
      );
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function handleSelect(entry: HistoryEntry) {
    abortRef.current?.abort();
    setQuery(entry.label);
    setError(null);
    setBusy(false);
    setTarget({ lat: entry.lat, lng: entry.lng, label: entry.label });
    recordTarget({ lat: entry.lat, lng: entry.lng, label: entry.label });
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
        busy={busy}
      />

      <section className="app__body">
        <ImageDisplay target={target} error={error} busy={busy} />
        <HistoryPanel
          entries={history}
          onSelect={handleSelect}
          onClear={() => setHistory([])}
        />
      </section>
    </main>
  );
}
