#!/usr/bin/env node
import { MockProvider } from "./mock-provider.js";
import { startStdio } from "./stdio-run.js";
import { describeError } from "./util/errors.js";
import { logger, type LogLevel } from "./util/logger.js";

// The default binary runs with sample data. For live data, embed the server in
// a package that supplies a real GodelDataProvider — see the README.
async function main(): Promise<void> {
  logger.setLevel((process.env.GODEL_LOG_LEVEL as LogLevel) || "info");
  await startStdio(new MockProvider());
  logger.info("godel-mcp ready on stdio (sample-data provider — inject a real one for live data)");

  const shutdown = (sig: string): void => {
    logger.info(`received ${sig}, shutting down`);
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("fatal error on startup", { error: describeError(err) });
  process.exit(1);
});
