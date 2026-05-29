import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

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

    // Coordinates surface in the viewport and in a new history entry.
    expect(screen.getAllByText(/37\.42200/).length).toBeGreaterThan(0);
    const history = screen.getByRole("complementary", {
      name: /search history/i,
    });
    expect(within(history).getByText(/37\.42200/)).toBeInTheDocument();
  });

  it("rejects free-text addresses until geocoding lands", async () => {
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "oslo");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
