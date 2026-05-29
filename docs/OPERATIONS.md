# SatelliteSnap — Operations & Monitoring

How the app is deployed, observed, and kept healthy.

## Deployment

| Component | Target               | Trigger                                   |
| --------- | -------------------- | ----------------------------------------- |
| Frontend  | GitHub Pages         | push to `main` → `pages.yml`       |
| Backend   | Container (optional) | `deploy/Dockerfile.backend`               |

**One-time:** Settings → Pages → Source = **GitHub Actions** (enables the Pages
deploy). After that every merge to `main` ships automatically.

## Monitoring

- **Live smoke check** (`.github/workflows/smoke.yml`): after each deploy, daily
  at 07:00 UTC, and on demand. Fails (red run + notification) if the live site
  isn't `200` or stops containing the app marker — a zero-cost uptime monitor.
- **Backend health**: `GET /api/health` returns `{ status, service, database }`.
  Point an external uptime check (or container orchestrator healthcheck) at it.
- **Request logs**: the backend emits one JSON line per request
  (`{ t, method, path, status, ms }`) — scrape/ship to any aggregator. Errors
  are logged via the central error handler before returning a `500`.

## Routine checks

```bash
# Frontend is live
curl -fsS https://agntdev.github.io/satellitesnap/ | grep -qi satellitesnap

# Backend is healthy (if deployed)
curl -fsS https://<backend-host>/api/health
```

## Incident playbook

| Symptom                         | First checks                                              |
| ------------------------------- | -------------------------------------------------------- |
| Smoke check red                 | Re-run `pages.yml`; confirm Pages source = Actions |
| Map tiles blank                 | Esri World Imagery status; browser console for tile 4xx   |
| Geocoding fails for everything  | OpenStreetMap Nominatim status / rate limiting            |
| Time-travel timeline empty      | Wayback catalogue fetch — falls back to bundled releases  |
| History not saving (with API)   | Backend `/api/health`, `DATABASE_URL`, request logs       |

## Rollback

The frontend deploy is just a static artifact — revert the offending commit on
`main` and the next `pages.yml` run republishes the previous build. The
backend rolls back by redeploying the prior image tag.

## Ongoing maintenance

- Imagery/geocoding are third-party (Esri, OpenStreetMap) — watch their status
  pages and attribution/usage terms.
- Keep dependencies current; CI (`ci.yml`) must stay green on every PR.
