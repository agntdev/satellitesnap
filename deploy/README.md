# Deployment

SatelliteSnap ships in two independent pieces. The **frontend is fully
functional on its own** (history falls back to `localStorage`), so the public
deployment is just the static bundle on GitHub Pages. The **backend + Postgres**
are optional and add shared, durable history.

## Frontend → GitHub Pages (primary)

Automated by [`.github/workflows/pages.yml`](../.github/workflows/pages.yml):
on every push to `main` it builds `frontend/` and deploys `dist/` to Pages.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub
Actions.**

`vite.config.ts` uses `base: "./"`, so the bundle works at the
`/satellitesnap/` subpath with no extra config. Permalinks are encoded in the
query string on the root path (`?ll=…`), so they survive a hard refresh with no
SPA path-rewrite. To point the frontend at a deployed API, set `VITE_API_URL`
at build time (see `frontend/.env.example`).

## Backend → container (optional)

Build and run the API image:

```bash
docker build -f deploy/Dockerfile.backend -t satellitesnap-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL=postgres://user:pass@host:5432/satellitesnap \
  -e CORS_ORIGIN=https://agntdev.github.io \
  satellitesnap-backend
```

Apply migrations against the production database first:

```bash
cd db && DATABASE_URL=postgres://… node migrate.mjs
```

### Configuration

| Variable      | Used by  | Purpose                                            |
| ------------- | -------- | -------------------------------------------------- |
| `PORT`        | backend  | Listen port (default 3001)                         |
| `DATABASE_URL`| backend  | Postgres connection string (memory store if unset) |
| `CORS_ORIGIN` | backend  | Allowed frontend origin (default `*`)              |
| `VITE_API_URL`| frontend | Backend base URL at build time (empty = local-only) |

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) gates every PR:
frontend typecheck/test/build and backend typecheck/test/build against a real
Postgres service with migrations applied.

## Health & smoke check

```bash
curl -fsS https://<backend-host>/api/health   # {"status":"ok",...}
```
