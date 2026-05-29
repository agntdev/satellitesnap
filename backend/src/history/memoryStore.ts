import {
  HISTORY_LIMIT,
  type HistoryInput,
  type HistoryRecord,
  type HistoryStore,
} from "./store.js";

/**
 * In-memory history store. Used in tests and as a graceful fallback when no
 * DATABASE_URL is configured, so the API stays functional (per-process) even
 * without Postgres.
 */
export class MemoryHistoryStore implements HistoryStore {
  private byClient = new Map<string, HistoryRecord[]>();
  private seq = 0;
  private now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  async list(clientId: string, limit = HISTORY_LIMIT): Promise<HistoryRecord[]> {
    return (this.byClient.get(clientId) ?? []).slice(0, limit);
  }

  async add(clientId: string, input: HistoryInput): Promise<HistoryRecord> {
    this.seq += 1;
    const record: HistoryRecord = {
      id: String(this.seq),
      label: input.label,
      lat: input.lat,
      lng: input.lng,
      searchedAt: new Date(this.now()).toISOString(),
    };
    const existing = this.byClient.get(clientId) ?? [];
    // De-dupe by coordinates, newest first, cap the list.
    const deduped = existing.filter(
      (r) => r.lat !== input.lat || r.lng !== input.lng,
    );
    this.byClient.set(clientId, [record, ...deduped].slice(0, HISTORY_LIMIT));
    return record;
  }

  async clear(clientId: string): Promise<void> {
    this.byClient.delete(clientId);
  }
}
