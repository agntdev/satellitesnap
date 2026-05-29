import type { Pool } from "pg";
import {
  HISTORY_LIMIT,
  type HistoryInput,
  type HistoryRecord,
  type HistoryStore,
} from "./store.js";

interface Row {
  id: string;
  label: string;
  lat: number;
  lng: number;
  searched_at: Date;
}

function toRecord(row: Row): HistoryRecord {
  return {
    id: String(row.id),
    label: row.label,
    lat: Number(row.lat),
    lng: Number(row.lng),
    searchedAt: row.searched_at.toISOString(),
  };
}

/** Postgres-backed history store. */
export class PgHistoryStore implements HistoryStore {
  constructor(private pool: Pool) {}

  async list(clientId: string, limit = HISTORY_LIMIT): Promise<HistoryRecord[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT id, label, lat, lng, searched_at
         FROM searches
        WHERE client_id = $1
        ORDER BY searched_at DESC
        LIMIT $2`,
      [clientId, limit],
    );
    return rows.map(toRecord);
  }

  async add(clientId: string, input: HistoryInput): Promise<HistoryRecord> {
    // Collapse repeat lookups of the same spot to the latest one.
    await this.pool.query(
      `DELETE FROM searches WHERE client_id = $1 AND lat = $2 AND lng = $3`,
      [clientId, input.lat, input.lng],
    );
    const { rows } = await this.pool.query<Row>(
      `INSERT INTO searches (client_id, label, lat, lng)
       VALUES ($1, $2, $3, $4)
       RETURNING id, label, lat, lng, searched_at`,
      [clientId, input.label, input.lat, input.lng],
    );
    return toRecord(rows[0]);
  }

  async clear(clientId: string): Promise<void> {
    await this.pool.query(`DELETE FROM searches WHERE client_id = $1`, [
      clientId,
    ]);
  }
}
