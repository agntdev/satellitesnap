import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "./components/SearchBar";
import ImageDisplay from "./components/ImageDisplay";
import HistoryPanel from "./components/HistoryPanel";
import TimeTravel from "./components/TimeTravel";
import { geocode, GeocodeError } from "./services/geocode";
import { historyService } from "./services/history";
import {
  fetchWaybackReleases,
  waybackSource,
  type WaybackRelease,
} from "./services/wayback";
import type { HistoryEntry, Target } from "./types";

export default function App() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [releases, setReleases] = useState<WaybackRelease[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releaseIndex, setReleaseIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted history on mount.
  useEffect(() => {
    let live = true;
    historyService
      .list()
      .then((items) => live && setHistory(items))
      .catch(() => {
        /* non-fatal: start with an empty list */
      });
    return () => {
      live = false;
    };
  }, []);

  // Load the imagery timeline (Esri Wayback releases) once.
  useEffect(() => {
    const controller = new AbortController();
    fetchWaybackReleases(controller.signal)
      .then((r) => {
        setReleases(r);
        setReleasesLoading(false);
      })
      .catch(() => setReleasesLoading(false));
    return () => controller.abort();
  }, []);

  // The selected historical imagery layer (newest by default).
  const source = useMemo(
    () => (releases.length ? waybackSource(releases[releaseIndex]) : undefined),
    [releases, releaseIndex],
  );

  async function recordTarget(next: Target) {
    try {
      setHistory(await historyService.add(next));
    } catch {
      /* persistence is best-effort; keep the session usable */
    }
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
      await recordTarget(next);
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
    const next: Target = { lat: entry.lat, lng: entry.lng, label: entry.label };
    setQuery(entry.label);
    setError(null);
    setBusy(false);
    setTarget(next);
    void recordTarget(next);
  }

  async function handleClear() {
    setHistory([]);
    try {
      await historyService.clear();
    } catch {
      /* ignore */
    }
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
        <ImageDisplay
          target={target}
          error={error}
          busy={busy}
          source={source}
          footer={
            target ? (
              <TimeTravel
                releases={releases}
                index={releaseIndex}
                onChange={setReleaseIndex}
                loading={releasesLoading}
              />
            ) : null
          }
        />
        <HistoryPanel
          entries={history}
          onSelect={handleSelect}
          onClear={handleClear}
        />
      </section>
    </main>
  );
}
