# satellitesnap

Get the freshest satellite photos of any address or coordinates with a minimalist hacker interface.

## Architecture

| Package     | Stack                              | Purpose                                              |
| ----------- | ---------------------------------- | ---------------------------------------------------- |
| `frontend/` | React 18 + TypeScript + Vite       | Single-page hacker-themed UI, Leaflet map, history   |
| `backend/`  | Node.js + Express + TypeScript     | Search-history API and proxy endpoints               |
| `db/`       | PostgreSQL + plain SQL migrations  | Persistent search history                            |

The frontend is fully usable on its own (it falls back to `localStorage` when
no API is configured), which is what the public GitHub Pages build relies on.
The backend + database add shared, durable history when deployed.

## Development

```bash
# Frontend
cd frontend && npm install && npm run dev      # http://localhost:5173

# Backend
cd backend && npm install && cp .env.example .env && npm run dev   # http://localhost:3001

# Database (optional, for shared history)
cd db && npm install && DATABASE_URL=… npm run migrate
```

## Tasks

The project is built across the tasks tracked in [`tasks/`](./tasks) (T01–T15).
