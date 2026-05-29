import { describe, expect, it } from "vitest";
import { MemoryHistoryStore } from "./memoryStore.js";
import { HISTORY_LIMIT } from "./store.js";

describe("MemoryHistoryStore", () => {
  it("returns entries newest-first", async () => {
    const store = new MemoryHistoryStore();
    await store.add("c", { label: "a", lat: 1, lng: 1 });
    await store.add("c", { label: "b", lat: 2, lng: 2 });
    const items = await store.list("c");
    expect(items.map((i) => i.label)).toEqual(["b", "a"]);
  });

  it("caps the list at HISTORY_LIMIT", async () => {
    const store = new MemoryHistoryStore();
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      await store.add("c", { label: `p${i}`, lat: i, lng: i });
    }
    expect(await store.list("c")).toHaveLength(HISTORY_LIMIT);
  });

  it("honours an explicit limit on list", async () => {
    const store = new MemoryHistoryStore();
    await store.add("c", { label: "a", lat: 1, lng: 1 });
    await store.add("c", { label: "b", lat: 2, lng: 2 });
    expect(await store.list("c", 1)).toHaveLength(1);
  });

  it("stamps searchedAt from the injected clock", async () => {
    const store = new MemoryHistoryStore(() => 1_000_000);
    const rec = await store.add("c", { label: "a", lat: 1, lng: 1 });
    expect(rec.searchedAt).toBe(new Date(1_000_000).toISOString());
  });
});
