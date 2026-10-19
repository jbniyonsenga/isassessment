import "server-only";

type Fields = Record<string, string | number | boolean | undefined>;

/**
 * Structured logging. Callers must never pass answers, organization details or
 * email addresses (NFR-008) — only event names, ids and technical error messages.
 */
function write(level: "info" | "warn" | "error", event: string, fields: Fields = {}) {
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (event: string, fields?: Fields) => write("info", event, fields),
  warn: (event: string, fields?: Fields) => write("warn", event, fields),
  error: (event: string, error: unknown, fields?: Fields) =>
    write("error", event, { ...fields, error: error instanceof Error ? error.message : String(error) }),
};
