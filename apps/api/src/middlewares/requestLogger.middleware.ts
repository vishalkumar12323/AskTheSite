import { Request, Response, NextFunction } from "express";
import { logger } from "../logger/logger.js";

/**
 * HTTP Request/Response Logger Middleware
 *
 * Automatically tracks every incoming request and its matching response:
 *   → [API] POST /api/conversations  { ip, ua, contentLength }
 *   ← [API] 201  47ms
 *
 * HOW THE RESPONSE CAPTURE WORKS:
 * Express/Node doesn't emit an event when a response is fully sent.
 * The standard technique (used by Morgan and similar libraries) is to
 * monkey-patch `res.end()`. Since every response — JSON, stream, redirect —
 * ultimately calls `res.end()`, we intercept it, record the status + duration,
 * log it, and then invoke the original `res.end()` to complete the cycle.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startAt = process.hrtime.bigint(); // nanosecond precision

  // ── Inbound request log ──────────────────────────────────────────────────
  logger.api(`→ ${req.method} ${req.path}`, {
    ip:            req.ip ?? req.socket.remoteAddress ?? "unknown",
    ua:            req.headers["user-agent"] ?? "unknown",
    contentLength: req.headers["content-length"] ?? "0",
  });

  // ── Monkey-patch res.end to capture response ─────────────────────────────
  const originalEnd = res.end.bind(res) as typeof res.end;

  // Override res.end with a wrapper that logs before delegating
  // The "as any" casts are necessary because TypeScript's overloaded
  // res.end signature doesn't match a simple wrapper function signature.
  (res as any).end = function (
    ...args: Parameters<typeof res.end>
  ): ReturnType<typeof res.end> {
    const durationNs = process.hrtime.bigint() - startAt;
    const durationMs = Number(durationNs / 1_000_000n);

    const statusCode = res.statusCode;
    const level      = statusCode >= 500 ? "error"
                     : statusCode >= 400 ? "warn"
                     : "ok";

    const logMeta: Record<string, unknown> = {
      status:     statusCode,
      durationMs: `${durationMs}ms`,
    };

    if (level === "error") {
      logger.error(`← ${req.method} ${req.path} ${statusCode}  ${durationMs}ms`, undefined, logMeta);
    } else {
      logger.api(`← ${req.method} ${req.path} ${statusCode}  ${durationMs}ms`, logMeta);
    }

    // Restore and call the original res.end
    return (originalEnd as any)(...args);
  };

  next();
}
