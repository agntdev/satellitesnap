import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "./components/SearchBar";
import ImageDisplay from "./components/ImageDisplay";
import HistoryPanel from "./components/HistoryPanel";
import TimeTravel from "./components/TimeTravel";
import ShareButton from "./components/ShareButton";
import MetadataPanel from "./components/MetadataPanel";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { buildMetadata } from "./services/metadata";
import { geocode, GeocodeError } from "./services/geocode";
import { historyService } from "./services/history";
import {
  fetchWaybackReleases,
  waybackSource,
  type WaybackRelease,
} from "./services/wayback";
import { buildShareUrl, parsePermalink } from "./services/permalink";
import { useI18n, type TranslationKey } from "./i18n";
import type { HistoryEntry, Target } from "./types";

/**
 * An error held as a translation key (+ params) rather than a baked
 * string, so it re-localizes live when the user switches language.
 */
interface AppError {
  key: TranslationKey;
  params?: Record<string, string | number>;
}

export default function App() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [releases, setReleases] = useState<WaybackRelease[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releaseIndex, setReleaseIndex] = useState(0);
  const [zoom, setZoom] = useState(17);
  const abortRef = useRef<AbortController | null>(null);
  // A release date requested via permalink, applied once the timeline loads.
  const pendingDateRef = useRef<string | null>(null);

  function applyTarget(next: Target, record = true) {
    abortRef.current?.abort();
    setTarget(next);
    setError(null);
    setBusy(false);
    setQuery(next.label);
    if (record) void recordTarget(next);
  }

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

  // Restore a shared view from the URL on first load.
  useEffect(() => {
    const state = parsePermalink(window.location.search);
    if (state) {
      pendingDateRef.current = state.date ?? null;
      applyTarget(state.target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the imagery timeline (Esri Wayback releases) once.
  useEffect(() => {
    const controller = new AbortController();
    fetchWaybackReleases(controller.signal)
      .then((r) => {
        setReleases(r);
        setReleasesLoading(false);
        // Honour a permalinked date now that we know the available releases.
        if (pendingDateRef.current) {
          const idx = r.findIndex((rel) => rel.date === pendingDateRef.current);
          if (idx >= 0) setReleaseIndex(idx);
          pendingDateRef.current = null;
        }
      })
      .catch(() => setReleasesLoading(false));
    return () => controller.abort();
  }, []);

  // The selected historical imagery layer (newest by default).
  const source = useMemo(
    () => (releases.length ? waybackSource(releases[releaseIndex]) : undefined),
    [releases, releaseIndex],
  );

  const selectedDate = releases[releaseIndex]?.date;

  // Keep the address bar in sync so the current view is always shareable.
  useEffect(() => {
    if (!target) return;
    const url = buildShareUrl(
      { target, date: selectedDate },
      window.location.href,
    );
    window.history.replaceState(null, "", url);
  }, [target, selectedDate]);

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
          ? { key: `error.${err.code}` as TranslationKey, params: err.params }
          : { key: "error.unexpected" },
      );
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }

  function handleSelect(entry: HistoryEntry) {
    applyTarget({ lat: entry.lat, lng: entry.lng, label: entry.label });
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setError({ key: "error.noGeolocation" });
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        void handleSearch(
          `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`,
        );
      },
      (err) => {
        setBusy(false);
        setError({
          key:
            err.code === err.PERMISSION_DENIED
              ? "error.geoDenied"
              : "error.geoFailed",
        });
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function handleClear() {
    setHistory([]);
    try {
      await historyService.clear();
    } catch {
      /* ignore */
    }
  }

  const errorText = error ? t(error.key, error.params) : null;

  return (
    <main className="app">
      <header className="app__header">
        <div className="app__bar">
          <h1 className="app__title">
            <span className="app__prompt">$</span>
            <span className="cursor">satellitesnap</span>
          </h1>
          <LanguageSwitcher />
        </div>
        <p className="app__tagline">{t("tagline")}</p>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        onLocate={handleLocate}
        busy={busy}
      />

      {/* Polite status line for assistive tech. */}
      <p className="app__status" role="status" aria-live="polite">
        {busy
          ? t("status.acquiring")
          : errorText
            ? errorText
            : target
              ? t("status.target", { label: target.label })
              : ""}
      </p>

      <section className="app__body">
        <ImageDisplay
          target={target}
          error={errorText}
          busy={busy}
          source={source}
          onZoomChange={setZoom}
          overlay={
            target ? (
              <MetadataPanel
                metadata={buildMetadata(target, source, selectedDate, zoom)}
              />
            ) : null
          }
          footer={
            target ? (
              <div className="viewport__tools">
                <TimeTravel
                  releases={releases}
                  index={releaseIndex}
                  onChange={setReleaseIndex}
                  loading={releasesLoading}
                />
                <ShareButton
                  url={buildShareUrl(
                    { target, date: selectedDate },
                    window.location.href,
                  )}
                />
              </div>
            ) : null
          }
        />
        <HistoryPanel
          entries={history}
          onSelect={handleSelect}
          onClear={handleClear}
        />
      </section>

      <footer className="app__footer text-dim">
        <span>{t("footer.imagery")}</span>
        <span>·</span>
        <span>{t("footer.geocoding")}</span>
        <span>·</span>
        <a
          href="https://github.com/agntdev/satellitesnap"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer.source")}
        </a>
      </footer>
    </main>
  );
}
