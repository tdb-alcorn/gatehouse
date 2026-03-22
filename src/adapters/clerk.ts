import type { GatehouseSubject } from "../core/types.js";

/**
 * Clerk adapter for Gatehouse.
 *
 * Reads role from Clerk's `publicMetadata.role` (the standard pattern).
 *
 * ```ts
 * // lib/gate.ts
 * import { createServerGate } from "gatehouse/next";
 * import { clerkResolver } from "gatehouse/adapters/clerk";
 * import { gh } from "./gatehouse";
 *
 * export const gate = createServerGate({
 *   gatehouse: gh,
 *   resolve: clerkResolver(),
 * });
 * ```
 */
export function clerkResolver(options?: {
  /** Custom metadata key for the role. Default: "role" */
  roleKey?: string;
  /** Default role for authenticated users with no role set. Default: "viewer" */
  defaultRole?: string;
}): () => Promise<GatehouseSubject | null> {
  const roleKey = options?.roleKey ?? "role";
  const defaultRole = options?.defaultRole ?? "viewer";

  return async () => {
    // Dynamic import to avoid bundling @clerk/nextjs when not used
    // @ts-expect-error -- @clerk/nextjs is a peer dependency
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();

    if (!user) return null;

    const role =
      (user.publicMetadata as Record<string, unknown>)?.[roleKey] as
        | string
        | undefined;

    return { role: role ?? defaultRole };
  };
}
