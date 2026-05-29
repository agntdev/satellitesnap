import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/geocode", () => ({
  suggest: vi.fn(async () => [
    { lat: 51.5, lng: -0.12, label: "London, UK", kind: "city" },
    { lat: 42.98, lng: -81.24, label: "London, ON, Canada", kind: "city" },
  ]),
}));

import SearchBar from "./SearchBar";
import { suggest } from "../services/geocode";

beforeEach(() => vi.clearAllMocks());

describe("SearchBar autocomplete", () => {
  it("shows suggestions and resolves a clicked one via onPick", async () => {
    const onPick = vi.fn();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} onPick={onPick} />);

    await userEvent.type(screen.getByRole("textbox"), "london");
    const opt = await screen.findByText("London, ON, Canada");
    await userEvent.click(opt);

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ label: "London, ON, Canada", lat: 42.98 }),
    );
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("supports keyboard selection (ArrowDown + Enter)", async () => {
    const onPick = vi.fn();
    render(<SearchBar onSearch={() => {}} onPick={onPick} />);

    await userEvent.type(screen.getByRole("textbox"), "london");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ label: "London, UK" }),
    );
  });

  it("does not fetch suggestions when onPick is absent (plain search box)", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.type(screen.getByRole("textbox"), "london");
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));

    expect(suggest).not.toHaveBeenCalled();
    expect(onSearch).toHaveBeenCalledWith("london");
  });
});
