import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────────────────────────────────────
// Directory Setup
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolves to apps/api/logs/ regardless of where the process runs from
const LOG_DIR = path.resolve(__dirname, "../../logs");

// Ensure the logs directory exists before we try to write to it
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILES = {
  API_SERVICE: path.join(LOG_DIR, "api.log"),
  WORKER:      path.join(LOG_DIR, "worker.log"),
  SYSTEM:      path.join(LOG_DIR, "system.log"),
  ERROR:       path.join(LOG_DIR, "error.log"),
  INFO:        path.join(LOG_DIR, "system.log"), // INFO shares the system log
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LogCategory = "API_SERVICE" | "WORKER" | "SYSTEM" | "ERROR" | "INFO";

interface LogEntry {
  timestamp: string;
  category: LogCategory;
  message: string;
  meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSI Terminal Colors
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",   // API
  magenta: "\x1b[35m",   // WORKER
  green:   "\x1b[32m",   // SYSTEM
  red:     "\x1b[31m",   // ERROR
  yellow:  "\x1b[33m",   // INFO
};

const CATEGORY_STYLE: Record<LogCategory, { color: string; label: string }> = {
  API_SERVICE: { color: C.cyan,    label: "API    " },
  WORKER:      { color: C.magenta, label: "WORKER " },
  SYSTEM:      { color: C.green,   label: "SYSTEM " },
  ERROR:       { color: C.red,     label: "ERROR  " },
  INFO:        { color: C.yellow,  label: "INFO   " },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Write Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats and writes a log entry to:
 *  1. stdout  – colored, human-readable
 *  2. disk    – newline-delimited JSON (JSONL) for log aggregators
 */
function writeLog(
  category: LogCategory,
  message: string,
  meta?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const entry: LogEntry = { timestamp, category, message, ...(meta ? { meta } : {}) };

  // ── Console (colored) ────────────────────────────────────────────────────
  const { color, label } = CATEGORY_STYLE[category];
  const ts    = `${C.dim}${timestamp}${C.reset}`;
  const cat   = `${color}${C.bold}[${label}]${C.reset}`;
  const msg   = message;
  const metaStr = meta ? `  ${C.dim}${JSON.stringify(meta)}${C.reset}` : "";

  if (category === "ERROR") {
    console.error(`${ts} ${cat} ${msg}${metaStr}`);
  } else {
    console.log(`${ts} ${cat} ${msg}${metaStr}`);
  }

  // ── Disk (JSONL) ──────────────────────────────────────────────────────────
  // appendFileSync is intentionally synchronous — guarantees no log is lost
  // even if the process crashes immediately after.
  try {
    fs.appendFileSync(LOG_FILES[category], JSON.stringify(entry) + "\n", "utf8");
  } catch {
    // Never let a logging failure crash the application
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Logger Interface
// ─────────────────────────────────────────────────────────────────────────────

export const logger = {
  /**
   * API SERVICE logs — every inbound HTTP request and outbound HTTP response.
   * Called automatically by requestLogger middleware; do not call manually.
   */
  api(message: string, meta?: Record<string, unknown>): void {
    writeLog("API_SERVICE", message, meta);
  },

  /**
   * WORKER logs — BullMQ job lifecycle events (received, stage transitions, complete/fail).
   * Not actively used by the API service but kept for interface parity.
   */
  worker(message: string, meta?: Record<string, unknown>): void {
    writeLog("WORKER", message, meta);
  },

  /**
   * SYSTEM logs — server lifecycle, Redis events, Socket.IO, queue operations.
   * Use these as checkpoints inside services and infrastructure code.
   */
  system(message: string, meta?: Record<string, unknown>): void {
    writeLog("SYSTEM", message, meta);
  },

  /**
   * ERROR logs — caught exceptions with optional Error object.
   * Automatically extracts stack trace from Error instances.
   */
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorMeta: Record<string, unknown> = { ...meta };

    if (error instanceof Error) {
      errorMeta.name    = error.name;
      errorMeta.message = error.message;
      errorMeta.stack   = error.stack;
    } else if (error !== undefined) {
      errorMeta.raw = String(error);
    }

    writeLog("ERROR", message, Object.keys(errorMeta).length ? errorMeta : undefined);
  },

  /**
   * INFO logs — general informational messages that don't fit the other categories.
   * Shares the system.log file on disk.
   */
  info(message: string, meta?: Record<string, unknown>): void {
    writeLog("INFO", message, meta);
  },
};
