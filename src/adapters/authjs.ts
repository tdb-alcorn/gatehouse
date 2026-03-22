import type { GatehouseSubject } from "../core/types.js";

/**
 * Auth.js (NextAuth) adapter for Gatehouse.
 *
 * Reads role from `session.user.role` (requires extending the session callback).
 *
 * ```ts
 * // lib/gate.ts
 * import { createServerGate } from "gatehouse/next";
 * import { authjsResolver } from "gatehouse/adapters/authjs";
 * import { gh } from "./gatehouse";
 * import { auth } from "./auth"; // your Auth.js auth() export
 *
 * export const gate = createServerGate({
 *   gatehouse: gh,
 *   resolve: authjsResolver({ auth }),
 * });
 * ```
 */
export function authjsResolver(options: {
  /** The Auth.js `auth()` function. */
  auth: () => Promise<{ user?: { role?: string } } | null>;
  /** Default role for authenticated users. Default: "viewer" */
  defaultRole?: string;
}): () => Promise<GatehouseSubject | null> {
  const defaultRole = options.defaultRole ?? "viewer";

  return async () => {
    const session = await options.auth();

    if (!session?.user) return null;

    return {
      role: session.user.role ?? defaultRole,
    };
  };
}
