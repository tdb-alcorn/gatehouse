import type { PermissionPattern } from "./types.js";

/**
 * Check if a permission pattern matches a concrete permission.
 *
 * Patterns:
 *   "*"           → matches everything
 *   "project:*"   → matches "project:read", "project:create", etc.
 *   "project:read" → exact match only
 */
export function matchesPermission(
  pattern: PermissionPattern,
  permission: string,
): boolean {
  if (pattern === "*") return true;
  if (pattern === permission) return true;

  if (pattern.endsWith(":*")) {
    const prefix = pattern.slice(0, -1); // "project:" from "project:*"
    return permission.startsWith(prefix);
  }

  return false;
}

/**
 * Check if any pattern in a list matches the given permission.
 */
export function hasPermission(
  patterns: readonly PermissionPattern[],
  permission: string,
): boolean {
  return patterns.some((p) => matchesPermission(p, permission));
}
