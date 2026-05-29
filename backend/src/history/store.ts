/** A persisted search-history record. */
export interface HistoryRecord {
  id: string;
  label: string;
  lat: number;
  lng: number;
  searchedAt: string; // ISO 8601
}

/** Fields accepted when recording a new search. */
export interface HistoryInput {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Storage abstraction for search history. The Express layer depends only on
 * this interface, so it can run against Postgres in production and an
 * in-memory store in tests without any database.
 */
export interface HistoryStore {
  list(clientId: string, limit?: number): Promise<HistoryRecord[]>;
  add(clientId: string, input: HistoryInput): Promise<HistoryRecord>;
  clear(clientId: string): Promise<void>;
}

export const HISTORY_LIMIT = 50;
