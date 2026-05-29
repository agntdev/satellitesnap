import { beforeEach, describe, expect, it } from "vitest";
import { historyService } from "./history";

// With no VITE_API_URL configured in tests, the service uses localStorage.

describe("historyService (localStorage)", () => {
  beforeEach(() => localStorage.clear());

  it("is in local (non-remote) mode under test", () => {
    expect(historyService.remote).toBe(false);
  });

  it("records, lists, de-dupes, and clears", async () => {
    expect(await historyService.list()).toEqual([]);

    await historyService.add({ lat: 1, lng: 2, label: "a" });
    await historyService.add({ lat: 3, lng: 4, label: "b" });
    let items = await historyService.list();
    expect(items.map((e) => e.label)).toEqual(["b", "a"]);

    // Re-adding the same spot moves it to the front without duplicating.
    await historyService.add({ lat: 1, lng: 2, label: "a" });
    items = await historyService.list();
    expect(items).toHaveLength(2);
    expect(items[0].label).toBe("a");

    await historyService.clear();
    expect(await historyService.list()).toEqual([]);
  });
});
