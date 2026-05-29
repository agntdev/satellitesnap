# SatelliteSnap — Testing

Test coverage spans three layers.

## Unit & integration (run in CI on every PR)

**Frontend** (`frontend/`, Vitest + Testing Library):

- `services/geocode` — coordinate parsing, Nominatim success/no-match/HTTP error, empty input.
- `services/history` — localStorage record/list/de-dupe/clear.
- `services/wayback` — config parse, template conversion, sort order, network fallback.
- `services/permalink` — encode/parse round-trip, range validation, label synthesis.
- `services/metadata` — Web-Mercator ground-resolution math, metadata assembly.
- Components — `SearchBar`, `TimeTravel`, `ShareButton`, `MetadataPanel`.
- `App` integration — coordinate search, address geocoding, error surfacing, history reopen/clear, permalink restore.

```bash
cd frontend && npm ci && npm run typecheck && npm test
```

**Backend** (`backend/`, Vitest + supertest):

- `/api/health`, unknown-route 404, history validation, per-client scoping.
- `MemoryHistoryStore` — ordering, cap, explicit limit, injected clock.

```bash
cd backend && npm ci && npm test
```

## End-to-end (Playwright)

Drives the real production build in a headless browser: loads the console,
snaps imagery for coordinates, records history, restores a permalink, and steps
the time-travel timeline.

```bash
cd frontend && npm ci && npm run build
cd e2e && npm ci && npm run install-browsers && npm test
```

## Notes / bugs addressed during testing

- Stale geocode results could clobber a newer search — fixed with an
  `AbortController` that cancels the in-flight request (`App.handleSearch`).
- Leaflet cannot mount in jsdom; unit tests stub `MapView` and the real map is
  exercised by the Playwright suite instead.
- Clipboard API is unavailable in insecure contexts — `ShareButton` falls back
  to a `textarea` + `execCommand("copy")`.
