import { describe, expect, it } from "vitest";
import { buildMetadata, groundResolution } from "./metadata";
import { ESRI_WORLD_IMAGERY } from "./imagery";

describe("groundResolution", () => {
  it("is ~0.6 m/px at the equator at zoom 18", () => {
    expect(groundResolution(0, 18)).toBeCloseTo(0.597, 2);
  });

  it("shrinks with latitude (cosine factor)", () => {
    expect(groundResolution(60, 18)).toBeLessThan(groundResolution(0, 18));
  });

  it("halves per zoom level", () => {
    expect(groundResolution(0, 17) / groundResolution(0, 18)).toBeCloseTo(2, 5);
  });
});

describe("buildMetadata", () => {
  const target = { lat: 51.5, lng: -0.12, label: "London" };

  it("assembles observable image facts", () => {
    const md = buildMetadata(target, ESRI_WORLD_IMAGERY, "2026-03-26", 17);
    expect(md).toMatchObject({
      label: "London",
      source: ESRI_WORLD_IMAGERY.name,
      date: "2026-03-26",
      zoom: 17,
    });
    expect(md.resolution).toMatch(/(cm|m)\/px/);
  });

  it("falls back to the latest source label and date", () => {
    const md = buildMetadata(target, undefined, undefined, 17);
    expect(md.source).toContain("Esri");
    expect(md.date).toBeUndefined();
  });
});
