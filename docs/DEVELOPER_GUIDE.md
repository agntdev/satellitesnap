# SatelliteSnap — Developer Guide

## Architecture overview

SatelliteSnap is a static-first single-page app with an optional API.

```
┌──────────────┐   geocode (Nominatim)     ┌────────────────────┐
│              │ ────────────────────────► │ OpenStreetMap      │
│   frontend   │   imagery (Esri/Wayback)  ├────────────────────┤
│ React + Vite │ ────────────────────────► │ Esri World Imagery │
│   (Leaflet)  │                            └────────────────────┘
│              │   history (optional)       ┌────────────────────┐
│              │ ────────────────────────► │ backend (Express)  │
└──────────────┘                            │   → PostgreSQL     │
       │ localStorage fallback              └────────────────────┘
       ▼ (when no API configured)
```

The frontend is fully usable with **no backend** — history falls back to
`localStorage`, geocoding/imagery hit public no-key APIs. That is exactly what
the GitHub Pages deployment relies on. The backend + Postgres add shared,
durable history.

## Repository layout

| Path        | What            | Notes                                            |
| ----------- | --------------- | ------------------------------------------------ |
| `frontend/` | React + TS app  | Vite, Vitest, Leaflet                            |
| `backend/`  | Express + TS    | history API, `HistoryStore` abstraction          |
| `db/`       | SQL migrations  | `migrate.mjs` forward-only runner                |
| `e2e/`      | Playwright      | drives the production build                      |
| `deploy/`   | Dockerfile, docs| backend image + deployment guide                 |
| `docs/`     | Documentation   | this guide + the user guide                      |

### Frontend modules

- `services/geocode.ts` — coordinate parsing + Nominatim address lookup (cached).
- `services/imagery.ts` — Esri tile source definitions.
- `services/wayback.ts` — historical release catalogue (fetched + cached).
- `services/history.ts` — API-or-localStorage history persistence.
- `services/permalink.ts` — URL ⇄ view-state encoding.
- `services/metadata.ts` — derived image metadata + resolution math.
- `components/` — `SearchBar`, `MapView` (Leaflet, lazy-loaded), `ImageDisplay`,
  `HistoryPanel`, `TimeTravel`, `ShareButton`, `MetadataPanel`.

## Local development

```bash
# Frontend (http://localhost:5173)
cd frontend && npm install && npm run dev

# Backend (http://localhost:3001) — optional
cd backend && npm install && cp .env.example .env && npm run dev

# Database — optional, for shared history
cd db && npm install && DATABASE_URL=postgres://… npm run migrate
```

To make the frontend use the backend, set `VITE_API_URL` (see
`frontend/.env.example`) before `npm run dev`/`npm run build`.

## Scripts

| Package    | `typecheck` | `test`       | `build`            | `dev`        |
| ---------- | ----------- | ------------ | ------------------ | ------------ |
| `frontend` | `tsc`       | Vitest       | `tsc && vite build`| `vite`       |
| `backend`  | `tsc`       | Vitest       | `tsc`              | `tsx watch`  |

## HTTP API

Base path `/api`. History is scoped by an `x-client-id` request header.

| Method & path        | Body                          | Response                         |
| -------------------- | ----------------------------- | -------------------------------- |
| `GET /api/health`    | —                             | `{ status, service, database }`  |
| `GET /api/history`   | —                             | `{ items: HistoryRecord[] }`     |
| `POST /api/history`  | `{ label, lat, lng }`         | `201` `HistoryRecord`            |
| `DELETE /api/history`| —                             | `204`                            |

`HistoryRecord = { id, label, lat, lng, searchedAt }`. Invalid bodies → `400`.

## Testing

See [`e2e/README.md`](../e2e/README.md). In short: `npm test` in `frontend/`
and `backend/` for unit/integration; the Playwright suite in `e2e/` for
end-to-end. CI runs all of the unit/integration layers on every PR.

## Deployment

See [`deploy/README.md`](../deploy/README.md).

## Contributing

1. Branch off `main`.
2. Keep `typecheck`, `test`, and `build` green in any package you touch.
3. Open a PR — CI must pass before merge.
