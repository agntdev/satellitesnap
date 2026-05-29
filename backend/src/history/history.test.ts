import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { MemoryHistoryStore } from "./memoryStore.js";

function app() {
  return createApp({ historyStore: new MemoryHistoryStore() });
}

const entry = { label: "Oslo, Norway", lat: 59.9133, lng: 10.7389 };

describe("history API", () => {
  let server: ReturnType<typeof app>;
  beforeEach(() => {
    server = app();
  });

  it("starts empty", async () => {
    const res = await request(server)
      .get("/api/history")
      .set("x-client-id", "c1");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("records and lists an entry", async () => {
    await request(server).post("/api/history").set("x-client-id", "c1").send(entry);
    const res = await request(server)
      .get("/api/history")
      .set("x-client-id", "c1");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ label: "Oslo, Norway" });
  });

  it("scopes history per client", async () => {
    await request(server).post("/api/history").set("x-client-id", "c1").send(entry);
    const res = await request(server)
      .get("/api/history")
      .set("x-client-id", "other");
    expect(res.body.items).toEqual([]);
  });

  it("de-duplicates repeat lookups of the same spot", async () => {
    await request(server).post("/api/history").set("x-client-id", "c1").send(entry);
    await request(server).post("/api/history").set("x-client-id", "c1").send(entry);
    const res = await request(server)
      .get("/api/history")
      .set("x-client-id", "c1");
    expect(res.body.items).toHaveLength(1);
  });

  it("rejects invalid coordinates", async () => {
    const res = await request(server)
      .post("/api/history")
      .set("x-client-id", "c1")
      .send({ label: "bad", lat: 999, lng: 0 });
    expect(res.status).toBe(400);
  });

  it("clears history", async () => {
    await request(server).post("/api/history").set("x-client-id", "c1").send(entry);
    await request(server).delete("/api/history").set("x-client-id", "c1");
    const res = await request(server)
      .get("/api/history")
      .set("x-client-id", "c1");
    expect(res.body.items).toEqual([]);
  });
});
