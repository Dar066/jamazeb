// Small helpers shared by the API route handlers.

const MAX_BODY_BYTES = 20_000;

/** Reads a JSON body, refusing anything that isn't JSON or is unreasonably large. */
export async function readJson(request: Request): Promise<unknown | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** JSON response that is never cached by browsers or CDNs. */
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
