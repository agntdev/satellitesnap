import { render, screen } from "@testing-library/react";
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
});
