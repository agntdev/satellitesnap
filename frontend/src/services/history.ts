import type { HistoryEntry, Target } from "../types";

/**
 * Search-history persistence.
 *
 * When a backend is configured (\`VITE_API_URL\`) history is shared/durable via
 * the API. Otherwise — notably the static GitHub Pages build — it transparently
 * falls back to \`localStorage\`, so the feature works with no server at all.
 */

const STORAGE_KEY = "satellitesnap.history.v1";
const CLIENT_KEY = "satellitesnap.client";
const LIMIT = 50;

const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function makeId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return `h${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** A stable per-browser identity used to scope server-side history. */
export function clientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

// ---- localStorage backend -------------------------------------------------

function readLocal(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, LIMIT)));
  } catch {
    /* storage full / unavailable — history is best-effort */
  }
}

// ---- server backend -------------------------------------------------------

interface ServerRecord {
  id: string;
  label: string;
  lat: number;
  lng: number;
  searchedAt: string;
}

function toEntry(r: ServerRecord): HistoryEntry {
  return {
    id: r.id,
    label: r.label,
    lat: r.lat,
    lng: r.lng,
    searchedAt: Date.parse(r.searchedAt) || Date.now(),
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`history API ${res.status}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export interface HistoryService {
  readonly remote: boolean;
  list(): Promise<HistoryEntry[]>;
  add(target: Target): Promise<HistoryEntry[]>;
  clear(): Promise<void>;
}

function localService(): HistoryService {
  return {
    remote: false,
    async list() {
      return readLocal();
    },
    async add(target) {
      const entry: HistoryEntry = {
        ...target,
        id: makeId(),
        searchedAt: Date.now(),
      };
      const deduped = readLocal().filter(
        (e) => e.lat !== target.lat || e.lng !== target.lng,
      );
      const next = [entry, ...deduped].slice(0, LIMIT);
      writeLocal(next);
      return next;
    },
    async clear() {
      writeLocal([]);
    },
  };
}

function remoteService(): HistoryService {
  return {
    remote: true,
    async list() {
      const { items } = await api<{ items: ServerRecord[] }>("/api/history");
      return items.map(toEntry);
    },
    async add(target) {
      await api<ServerRecord>("/api/history", {
        method: "POST",
        body: JSON.stringify({
          label: target.label,
          lat: target.lat,
          lng: target.lng,
        }),
      });
      return this.list();
    },
    async clear() {
      await api<void>("/api/history", { method: "DELETE" });
    },
  };
}

export const historyService: HistoryService = apiBase
  ? remoteService()
  : localService();
