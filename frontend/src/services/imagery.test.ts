import { describe, expect, it } from "vitest";
import { ESRI_WORLD_IMAGERY, ESRI_REFERENCE_OVERLAY } from "./imagery";

describe("imagery sources", () => {
  it("expose well-formed XYZ tile templates", () => {
    for (const src of [ESRI_WORLD_IMAGERY, ESRI_REFERENCE_OVERLAY]) {
      expect(src.url).toMatch(/\{z\}/);
      expect(src.url).toMatch(/\{x\}/);
      expect(src.url).toMatch(/\{y\}/);
      expect(src.maxZoom).toBeGreaterThan(0);
      expect(src.attribution).not.toHaveLength(0);
    }
  });
});
