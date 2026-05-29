import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the satellitesnap banner", () => {
    render(<App />);
    expect(screen.getByText(/satellitesnap/)).toBeInTheDocument();
  });

  it("shows the tagline", () => {
    render(<App />);
    expect(
      screen.getByText(/freshest satellite imagery/i),
    ).toBeInTheDocument();
  });
});
