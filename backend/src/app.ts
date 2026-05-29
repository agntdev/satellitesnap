import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { makeHistoryRouter } from "./history/router.js";
import { MemoryHistoryStore } from "./history/memoryStore.js";
import { PgHistoryStore } from "./history/pgStore.js";
import type { HistoryStore } from "./history/store.js";
import { getPool, hasDatabase } from "./db.js";
import { requestLogger } from "./logging.js";

export interface AppDeps {
  /** Override the history store (tests inject an in-memory one). */
  historyStore?: HistoryStore;
}

/** Pick the default store: Postgres when configured, else in-memory. */
function defaultHistoryStore(): HistoryStore {
  return hasDatabase() ? new PgHistoryStore(getPool()) : new MemoryHistoryStore();
}

/**
 * Build the Express application. Kept separate from the network bootstrap in
 * `server.ts` so tests can exercise routes via supertest without binding a port.
 */
export function createApp(deps: AppDeps = {}): Express {
  const app = express();
  const historyStore = deps.historyStore ?? defaultHistoryStore();

  app.use(requestLogger);
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "satellitesnap-backend",
      database: hasDatabase() ? "postgres" : "memory",
    });
  });

  app.use("/api/history", makeHistoryRouter(historyStore));

  // Centralised error handler so route bugs surface as 500s, not crashes.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
