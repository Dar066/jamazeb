import { json, readJson } from "@/lib/api";
import { mockPayFast } from "@/lib/payments/mock-payfast";

/** Checks the signed payment result before the store shows an order as paid. */
export async function POST(request: Request) {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return json({ valid: false }, 400);

  const params: Record<string, string | undefined> = {};
  for (const key of ["order", "amount", "outcome", "sig"]) {
    params[key] = typeof body[key] === "string" ? (body[key] as string) : undefined;
  }
  const result = mockPayFast.verifyResult(params);
  return json(result, result.valid ? 200 : 400);
}
