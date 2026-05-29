import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import MetadataPanel from "./MetadataPanel";
import type { ImageMetadata } from "../services/metadata";

const md: ImageMetadata = {
  label: "Eiffel Tower",
  lat: 48.8584,
  lng: 2.2945,
  source: "Esri World Imagery (latest)",
  date: "2026-03-26",
  zoom: 17,
  metersPerPixel: 1.2,
  resolution: "1.2 m/px",
};

describe("MetadataPanel", () => {
  it("is collapsed by default and expands on click", async () => {
    render(<MetadataPanel metadata={md} />);
    const toggle = screen.getByRole("button", { name: /metadata/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Eiffel Tower")).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Eiffel Tower")).toBeInTheDocument();
    expect(screen.getByText("2026-03-26")).toBeInTheDocument();
    expect(screen.getByText("1.2 m/px")).toBeInTheDocument();
  });
});
