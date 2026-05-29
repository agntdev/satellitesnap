import type { NextFunction, Request, Response } from "express";

/**
 * Minimal structured request logger. Emits one JSON line per request with
 * method, path, status, and duration — easy to ship to any log aggregator and
 * quiet during tests.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "test") return next();
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Math.round(ms),
      }),
    );
  });
  next();
}
