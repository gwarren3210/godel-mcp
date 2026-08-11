// A stderr-only leveled logger.
//
// IMPORTANT: an MCP stdio server speaks JSON-RPC over *stdout*. Writing
// anything else to stdout corrupts the protocol stream, so every diagnostic
// line here goes to stderr via console.error.

export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class Logger {
  constructor(private level: LogLevel = "info") {}

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private emit(level: LogLevel, msg: string, meta?: unknown): void {
    if (ORDER[level] < ORDER[this.level]) return;
    const line = meta === undefined ? msg : `${msg} ${safeJson(meta)}`;
    console.error(`[godel-mcp] ${level.toUpperCase().padEnd(5)} ${line}`);
  }

  debug(msg: string, meta?: unknown): void {
    this.emit("debug", msg, meta);
  }
  info(msg: string, meta?: unknown): void {
    this.emit("info", msg, meta);
  }
  warn(msg: string, meta?: unknown): void {
    this.emit("warn", msg, meta);
  }
  error(msg: string, meta?: unknown): void {
    this.emit("error", msg, meta);
  }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = new Logger();
