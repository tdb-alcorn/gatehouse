import type {
  RoleDefinitions,
  GatehouseConfig,
  Gatehouse,
  GatehouseSubject,
  ExtractRoles,
} from "./types.js";
import { hasPermission } from "./permissions.js";

/**
 * Create a Gatehouse instance.
 *
 * ```ts
 * const gh = createGatehouse({
 *   roles: {
 *     owner:  ["*"],
 *     admin:  ["project:*", "member:invite", "member:remove"],
 *     member: ["project:read", "project:create", "task:*"],
 *     viewer: ["project:read", "task:read"],
 *   },
 * });
 * ```
 *
 * Roles are hierarchical — first role is highest. An `owner` is "at least" an `admin`.
 */
export function createGatehouse<T extends RoleDefinitions>(
  config: GatehouseConfig<T>,
): Gatehouse<T> {
  type Role = ExtractRoles<T>;

  const roleNames = Object.keys(config.roles) as Role[];
  const roleRank = new Map<string, number>();
  roleNames.forEach((name, i) => roleRank.set(name, i));

  function resolveSubject(
    input: Role | GatehouseSubject<Role>,
  ): GatehouseSubject<Role> {
    if (typeof input === "string") return { role: input };
    return input;
  }

  function getPatterns(subject: GatehouseSubject<Role>): readonly string[] {
    const rolePatterns = config.roles[subject.role] ?? [];
    if (!subject.permissions?.length) return rolePatterns;
    return [...rolePatterns, ...subject.permissions];
  }

  function can(
    roleOrSubject: Role | GatehouseSubject<Role>,
    permission: string,
  ): boolean {
    const subject = resolveSubject(roleOrSubject);
    return hasPermission(getPatterns(subject), permission);
  }

  function canAll(
    roleOrSubject: Role | GatehouseSubject<Role>,
    permissions: string[],
  ): boolean {
    const subject = resolveSubject(roleOrSubject);
    const patterns = getPatterns(subject);
    return permissions.every((p) => hasPermission(patterns, p));
  }

  function canAny(
    roleOrSubject: Role | GatehouseSubject<Role>,
    permissions: string[],
  ): boolean {
    const subject = resolveSubject(roleOrSubject);
    const patterns = getPatterns(subject);
    return permissions.some((p) => hasPermission(patterns, p));
  }

  function isAtLeast(roleA: Role, roleB: Role): boolean {
    const rankA = roleRank.get(roleA);
    const rankB = roleRank.get(roleB);
    if (rankA === undefined || rankB === undefined) return false;
    return rankA <= rankB; // lower index = higher rank
  }

  function permissionsFor(role: Role): string[] {
    return [...(config.roles[role] ?? [])];
  }

  return {
    can,
    canAll,
    canAny,
    isAtLeast,
    permissionsFor,
    roles: roleNames,
    config: config.roles,
  };
}
