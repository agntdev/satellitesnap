import { describe, expect, it } from "vitest";
import {
  buildShareUrl,
  encodePermalink,
  parsePermalink,
} from "./permalink";

const target = { lat: 48.8584, lng: 2.2945, label: "Eiffel Tower" };

describe("permalink", () => {
  it("round-trips a target through encode/parse", () => {
    const qs = encodePermalink({ target, date: "2026-03-26" });
    const parsed = parsePermalink(qs);
    expect(parsed?.target.lat).toBeCloseTo(48.8584, 4);
    expect(parsed?.target.lng).toBeCloseTo(2.2945, 4);
    expect(parsed?.target.label).toBe("Eiffel Tower");
    expect(parsed?.date).toBe("2026-03-26");
  });

  it("builds an absolute share URL on the current origin", () => {
    const url = buildShareUrl(
      { target },
      "https://agntdev.github.io/satellitesnap/?old=1",
    );
    expect(url.startsWith("https://agntdev.github.io/satellitesnap/?")).toBe(
      true,
    );
    expect(url).toContain("ll=48.858400%2C2.294500");
  });

  it("returns null when no coordinates are present", () => {
    expect(parsePermalink("?q=nowhere")).toBeNull();
    expect(parsePermalink("")).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(parsePermalink("?ll=200,0")).toBeNull();
  });

  it("synthesises a label when none is given", () => {
    const parsed = parsePermalink("?ll=10,20");
    expect(parsed?.target.label).toBe("10.00000, 20.00000");
  });
});
