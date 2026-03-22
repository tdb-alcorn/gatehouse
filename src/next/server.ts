import type {
  Gatehouse,
  RoleDefinitions,
  GatehouseSubject,
  ExtractRoles,
} from "../core/types.js";

/** Options for creating a server-side gate. */
export interface CreateServerGateOptions<T extends RoleDefinitions> {
  gatehouse: Gatehouse<T>;
  /**
   * Resolve the current user from the request context.
   * Return null if unauthenticated.
   */
  resolve: () => Promise<GatehouseSubject<ExtractRoles<T>> | null>;
}

export class GatehouseError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GatehouseError";
  }
}

/**
 * Create a server-side gate for Next.js API routes and Server Components.
 *
 * ```ts
 * // lib/gate.ts
 * import { createServerGate } from "gatehouse/next";
 * import { gh } from "./gatehouse";
 * import { auth } from "./auth";
 *
 * export const gate = createServerGate({
 *   gatehouse: gh,
 *   resolve: async () => {
 *     const session = await auth();
 *     if (!session) return null;
 *     return { role: session.user.role };
 *   },
 * });
 * ```
 *
 * Then in API routes:
 * ```ts
 * export async function POST() {
 *   const subject = await gate("project:create");
 *   // subject is typed — guaranteed to have permission
 * }
 * ```
 */
export function createServerGate<T extends RoleDefinitions>(
  options: CreateServerGateOptions<T>,
) {
  type Role = ExtractRoles<T>;

  /**
   * Require a permission. Throws 401 (unauthenticated) or 403 (forbidden).
   * Returns the resolved subject on success.
   */
  async function gate(permission: string): Promise<GatehouseSubject<Role>>;
  /**
   * Require authentication only (no specific permission).
   */
  async function gate(): Promise<GatehouseSubject<Role>>;
  async function gate(
    permission?: string,
  ): Promise<GatehouseSubject<Role>> {
    const subject = await options.resolve();

    if (!subject) {
      throw new GatehouseError("Unauthorized", 401);
    }

    if (permission && !options.gatehouse.can(subject, permission)) {
      throw new GatehouseError("Forbidden", 403);
    }

    return subject;
  }

  /**
   * Require ALL listed permissions.
   */
  gate.all = async function gateAll(
    permissions: string[],
  ): Promise<GatehouseSubject<Role>> {
    const subject = await options.resolve();
    if (!subject) throw new GatehouseError("Unauthorized", 401);
    if (!options.gatehouse.canAll(subject, permissions)) {
      throw new GatehouseError("Forbidden", 403);
    }
    return subject;
  };

  /**
   * Require ANY of the listed permissions.
   */
  gate.any = async function gateAny(
    permissions: string[],
  ): Promise<GatehouseSubject<Role>> {
    const subject = await options.resolve();
    if (!subject) throw new GatehouseError("Unauthorized", 401);
    if (!options.gatehouse.canAny(subject, permissions)) {
      throw new GatehouseError("Forbidden", 403);
    }
    return subject;
  };

  /**
   * Require a minimum role level.
   */
  gate.role = async function gateRole(
    role: Role,
  ): Promise<GatehouseSubject<Role>> {
    const subject = await options.resolve();
    if (!subject) throw new GatehouseError("Unauthorized", 401);
    if (!options.gatehouse.isAtLeast(subject.role, role)) {
      throw new GatehouseError("Forbidden", 403);
    }
    return subject;
  };

  /**
   * Soft check — returns subject or null, never throws.
   */
  gate.check = async function gateCheck(
    permission?: string,
  ): Promise<GatehouseSubject<Role> | null> {
    const subject = await options.resolve();
    if (!subject) return null;
    if (permission && !options.gatehouse.can(subject, permission)) return null;
    return subject;
  };

  return gate;
}
