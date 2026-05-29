import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Leaflet drives real DOM/canvas work that jsdom can't host; the map itself is
// covered by the production build and the e2e suite. Stub it so the integration
// tests stay focused on App's state wiring.
vi.mock("./components/MapView", () => ({
  default: ({ target }: { target: { lat: number; lng: number } }) => (
    <div data-testid="mapview-stub">
      map @ {target.lat},{target.lng}
    </div>
  ),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renders the satellitesnap banner heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /satellitesnap/i }),
    ).toBeInTheDocument();
  });

  it("shows the tagline", () => {
    render(<App />);
    expect(screen.getByText(/freshest satellite imagery/i)).toBeInTheDocument();
  });

  it("acquires a coordinate target and records it in history", async () => {
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "37.4220,-122.0841");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));

    expect(await screen.findAllByText(/37\.42200/)).not.toHaveLength(0);
    const history = screen.getByRole("complementary", {
      name: /search history/i,
    });
    expect(within(history).getByText(/37\.42200/)).toBeInTheDocument();
  });

  it("geocodes a free-text address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { lat: "59.9133", lon: "10.7389", display_name: "Oslo, Norway" },
        ],
      })),
    );
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "oslo");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    expect(await screen.findByText(/59\.91330/)).toBeInTheDocument();
  });

  it("surfaces a geocoder error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => [] })),
    );
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "zzzz nowhere");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
