type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

function shouldLog(level: LogLevel) {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug("[CargoGuardian]", ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info("[CargoGuardian]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn("[CargoGuardian]", ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error("[CargoGuardian]", ...args);
  }
};
