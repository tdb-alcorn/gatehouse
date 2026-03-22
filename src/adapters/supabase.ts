import type { GatehouseSubject } from "../core/types.js";

/**
 * Supabase adapter for Gatehouse.
 *
 * Reads role from `app_metadata.role` or a custom profiles table.
 *
 * ```ts
 * // lib/gate.ts
 * import { createServerGate } from "gatehouse/next";
 * import { supabaseResolver } from "gatehouse/adapters/supabase";
 * import { gh } from "./gatehouse";
 * import { createClient } from "@/lib/supabase/server";
 *
 * export const gate = createServerGate({
 *   gatehouse: gh,
 *   resolve: supabaseResolver({ createClient }),
 * });
 * ```
 */
export function supabaseResolver(options: {
  /** Function that creates a Supabase server client. */
  createClient: () => any;
  /** Where to read the role from. Default: "app_metadata" */
  source?: "app_metadata" | "user_metadata" | { table: string; column?: string };
  /** Metadata key for the role. Default: "role" */
  roleKey?: string;
  /** Default role for authenticated users. Default: "viewer" */
  defaultRole?: string;
}): () => Promise<GatehouseSubject | null> {
  const roleKey = options.roleKey ?? "role";
  const defaultRole = options.defaultRole ?? "viewer";

  return async () => {
    const supabase = options.createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    let role: string | undefined;

    const source = options.source ?? "app_metadata";

    if (source === "app_metadata") {
      role = user.app_metadata?.[roleKey] as string | undefined;
    } else if (source === "user_metadata") {
      role = user.user_metadata?.[roleKey] as string | undefined;
    } else {
      // Read from a custom table
      const column = source.column ?? "role";
      const { data } = await supabase
        .from(source.table)
        .select(column)
        .eq("user_id", user.id)
        .single();
      role = data?.[column] as string | undefined;
    }

    return { role: role ?? defaultRole };
  };
}
