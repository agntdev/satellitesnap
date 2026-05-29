import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimeTravel from "./TimeTravel";
import { FALLBACK_RELEASES } from "../services/wayback";

describe("TimeTravel", () => {
  it("shows a loading state", () => {
    render(
      <TimeTravel releases={[]} index={0} onChange={() => {}} loading />,
    );
    expect(screen.getByText(/loading imagery timeline/i)).toBeInTheDocument();
  });

  it("renders the selected release date and marks the latest", () => {
    render(
      <TimeTravel releases={FALLBACK_RELEASES} index={0} onChange={() => {}} />,
    );
    expect(screen.getByText(FALLBACK_RELEASES[0].date)).toBeInTheDocument();
    expect(screen.getByText(/latest/i)).toBeInTheDocument();
  });

  it("steps to older imagery via the next button", async () => {
    const onChange = vi.fn();
    render(
      <TimeTravel releases={FALLBACK_RELEASES} index={0} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /older imagery/i }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables the newer button at the latest release", () => {
    render(
      <TimeTravel releases={FALLBACK_RELEASES} index={0} onChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /newer imagery/i })).toBeDisabled();
  });
});
