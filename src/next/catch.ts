import { NextResponse } from "next/server.js";
import { GatehouseError } from "./server.js";

/**
 * Wrap a Next.js route handler to automatically catch GatehouseErrors
 * and return proper HTTP responses.
 *
 * ```ts
 * import { withGate } from "gatehouse/next";
 * import { gate } from "@/lib/gate";
 *
 * export const POST = withGate(async () => {
 *   const subject = await gate("project:create");
 *   // ... create project
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */
export function withGate(
  handler: (request: Request) => Promise<Response>,
) {
  return async function wrappedHandler(request: Request): Promise<Response> {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof GatehouseError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  };
}
