// Public API — embed the server and supply your own data provider.

export { buildServer } from "./server.js";
export { startStdio } from "./stdio-run.js";
export { registerTools } from "./tools.js";
export { MockProvider } from "./mock-provider.js";
export * from "./provider.js";
export * as format from "./format.js";
export { logger } from "./util/logger.js";
export { GodelError, describeError } from "./util/errors.js";
