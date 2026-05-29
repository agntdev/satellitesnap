import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("submits the trimmed query", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByRole("textbox"), "  oslo  ");
    await userEvent.click(screen.getByRole("button"));
    expect(onSearch).toHaveBeenCalledWith("oslo");
  });

  it("does not submit an empty query", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.click(screen.getByRole("button", { name: /snap/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("exposes a locate control only when onLocate is provided", async () => {
    const onLocate = vi.fn();
    const { rerender } = render(<SearchBar onSearch={() => {}} />);
    expect(
      screen.queryByRole("button", { name: /use my location/i }),
    ).not.toBeInTheDocument();

    rerender(<SearchBar onSearch={() => {}} onLocate={onLocate} />);
    await userEvent.click(
      screen.getByRole("button", { name: /use my location/i }),
    );
    expect(onLocate).toHaveBeenCalled();
  });
});
