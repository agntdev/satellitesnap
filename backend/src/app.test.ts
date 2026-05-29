import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { MemoryHistoryStore } from "./history/memoryStore.js";

function app() {
  return createApp({ historyStore: new MemoryHistoryStore() });
}

describe("GET /api/health", () => {
  it("reports ok and the active storage backend", async () => {
    const res = await request(app()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      service: "satellitesnap-backend",
    });
    expect(res.body.database).toBeDefined();
  });
});

describe("routing", () => {
  it("404s on unknown routes", async () => {
    const res = await request(app()).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("rejects a history POST with a missing label", async () => {
    const res = await request(app())
      .post("/api/history")
      .set("x-client-id", "c1")
      .send({ lat: 1, lng: 2 });
    expect(res.status).toBe(400);
  });

  it("treats a missing client id as anonymous", async () => {
    const res = await request(app()).get("/api/history");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});
