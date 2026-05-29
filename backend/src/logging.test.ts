import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requestLogger } from "./logging.js";

describe("requestLogger", () => {
  it("passes control to the next middleware", () => {
    const next = vi.fn() as unknown as NextFunction;
    requestLogger({} as Request, { on: vi.fn() } as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not attach a finish listener during tests", () => {
    // NODE_ENV is "test" under Vitest, so logging is skipped entirely.
    const on = vi.fn();
    const next = vi.fn() as unknown as NextFunction;
    requestLogger({} as Request, { on } as unknown as Response, next);
    expect(on).not.toHaveBeenCalled();
  });
});
