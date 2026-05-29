import { Router } from "express";
import type { HistoryInput, HistoryStore } from "./store.js";

/** Read the per-client identity header; falls back to "anonymous". */
function clientIdOf(header: unknown): string {
  if (typeof header === "string" && header.trim()) return header.trim().slice(0, 128);
  return "anonymous";
}

/** Validate and normalise a POST body into a HistoryInput. */
function parseInput(body: unknown): HistoryInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { label, lat, lng } = body as Record<string, unknown>;
  if (typeof label !== "string" || !label.trim()) return null;
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return null;
  }
  if (
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return { label: label.trim().slice(0, 512), lat, lng };
}

export function makeHistoryRouter(store: HistoryStore): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const items = await store.list(clientIdOf(req.header("x-client-id")));
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const input = parseInput(req.body);
      if (!input) {
        res.status(400).json({ error: "invalid history entry" });
        return;
      }
      const record = await store.add(clientIdOf(req.header("x-client-id")), input);
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/", async (req, res, next) => {
    try {
      await store.clear(clientIdOf(req.header("x-client-id")));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
