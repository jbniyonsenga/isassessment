import "server-only";
import type { z } from "zod";

const MAX_BODY_BYTES = 32 * 1024;

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Reads a small JSON body and validates it; never echoes the submitted data back. */
export async function parseJson<S extends z.ZodType>(request: Request, schema: S): Promise<Parsed<z.infer<S>>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { ok: false, response: Response.json({ error: "Expected JSON" }, { status: 415 }) };
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, response: Response.json({ error: "Request too large" }, { status: 413 }) };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, response: Response.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((i) => i.path[0]).filter(Boolean))];
    return {
      ok: false,
      response: Response.json({ error: "Invalid request", fields }, { status: 400 }),
    };
  }
  return { ok: true, data: result.data };
}
