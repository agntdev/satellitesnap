import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  // Each test starts from a clean URL — a prior test's view is synced into the
  // address bar, and App restores permalinks on mount.
  window.history.replaceState({}, "", "/");
});

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

// Avoid hitting the live Esri Wayback catalogue from tests.
vi.mock("./services/wayback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./services/wayback")>();
  return {
    ...actual,
    fetchWaybackReleases: vi.fn(async () => actual.FALLBACK_RELEASES),
  };
});

afterEach(async () => {
  // Let any fire-and-forget history persistence settle before tearing down, so
  // a late localStorage write can't leak into the next test, then wipe storage.
  await new Promise((r) => setTimeout(r, 0));
  localStorage.clear();
  // NB: use clearAllMocks (not restoreAllMocks) — restoring would wipe the
  // module-level wayback mock's implementation and break later mounts.
  vi.clearAllMocks();
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

  it("reopens a target from history", async () => {
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "40.0,50.0");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    await screen.findAllByText(/40\.00000/);

    // A second, different search, then reopen the first from the history list.
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "10.0,20.0");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    await screen.findAllByText(/10\.00000/);

    const history = screen.getByRole("complementary", {
      name: /search history/i,
    });
    await userEvent.click(within(history).getByText(/40\.00000/));
    expect(screen.getByRole("textbox")).toHaveValue("40.00000, 50.00000");
  });

  it("clears history", async () => {
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "1.0,2.0");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    const history = screen.getByRole("complementary", {
      name: /search history/i,
    });
    await within(history).findByText(/1\.00000/);
    await userEvent.click(within(history).getByRole("button", { name: /clear history/i }));
    expect(within(history).getByText(/no recent scans/i)).toBeInTheDocument();
  });

  it("restores a shared view from the URL on load", async () => {
    window.history.replaceState({}, "", "/?ll=48.8584,2.2945&q=Eiffel%20Tower");
    render(<App />);
    expect(await screen.findByDisplayValue("Eiffel Tower")).toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });
});
