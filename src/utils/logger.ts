type LogLevel = "INFO" | "WARN" | "ERROR";

function writeLog(level: LogLevel, scope: string, message: string, details?: unknown) {
  const line = `${new Date().toISOString()} ${level} [${scope}] ${message}`;

  if (level === "ERROR") {
    details === undefined ? console.error(line) : console.error(line, details);
    return;
  }

  if (level === "WARN") {
    details === undefined ? console.warn(line) : console.warn(line, details);
    return;
  }

  details === undefined ? console.log(line) : console.log(line, details);
}

export const logger = {
  info(scope: string, message: string, details?: unknown) {
    writeLog("INFO", scope, message, details);
  },
  warn(scope: string, message: string, details?: unknown) {
    writeLog("WARN", scope, message, details);
  },
  error(scope: string, message: string, details?: unknown) {
    writeLog("ERROR", scope, message, details);
  },
};
