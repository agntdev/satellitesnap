import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareButton from "./ShareButton";

afterEach(() => vi.restoreAllMocks());

describe("ShareButton", () => {
  it("copies the URL and shows feedback", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<ShareButton url="https://example.com/?ll=1,2" />);
    await userEvent.click(screen.getByRole("button", { name: /copy shareable link/i }));

    expect(writeText).toHaveBeenCalledWith("https://example.com/?ll=1,2");
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
