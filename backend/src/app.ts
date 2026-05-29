import express, { type Express } from "express";
import cors from "cors";

/**
 * Build the Express application. Kept separate from the network bootstrap in
 * `server.ts` so tests can exercise routes via supertest without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "satellitesnap-backend" });
  });

  return app;
}
