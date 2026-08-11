// Typed errors so tool handlers can translate failures into useful messages
// for the model instead of leaking stack traces.

export class GodelError extends Error {
  constructor(message: string, readonly code = "GODEL_ERROR") {
    super(message);
    this.name = "GodelError";
  }
}

/** The session token/cookie was missing, rejected, or expired. */
export class GodelAuthError extends GodelError {
  constructor(message = "Godel session authentication failed") {
    super(message, "GODEL_AUTH");
    this.name = "GodelAuthError";
  }
}

/** A request was sent but no response arrived within the timeout window. */
export class GodelTimeoutError extends GodelError {
  constructor(message = "Godel request timed out") {
    super(message, "GODEL_TIMEOUT");
    this.name = "GodelTimeoutError";
  }
}

/** The socket is not connected (never opened, or dropped and not yet recovered). */
export class GodelConnectionError extends GodelError {
  constructor(message = "Not connected to Godel Terminal") {
    super(message, "GODEL_CONNECTION");
    this.name = "GodelConnectionError";
  }
}

/** Godel returned an application-level error for a command. */
export class GodelCommandError extends GodelError {
  constructor(message: string, code = "GODEL_COMMAND") {
    super(message, code);
    this.name = "GodelCommandError";
  }
}

export function describeError(err: unknown): string {
  if (err instanceof GodelError) return `${err.code}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
