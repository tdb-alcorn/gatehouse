"use client";

import { useMemo } from "react";
import { useGatehouseContext } from "./context.js";

/**
 * Check a single permission.
 *
 * ```ts
 * const canCreate = useGate("project:create");
 * ```
 */
export function useGate(permission: string): boolean {
  const { gatehouse, subject } = useGatehouseContext();
  return useMemo(
    () => (subject ? gatehouse.can(subject, permission) : false),
    [gatehouse, subject, permission],
  );
}

/**
 * Get the current user's role.
 *
 * ```ts
 * const role = useRole(); // "admin" | null
 * ```
 */
export function useRole(): string | null {
  const { subject } = useGatehouseContext();
  return subject?.role ?? null;
}

/**
 * Get all permissions for the current user's role.
 *
 * ```ts
 * const perms = usePermissions(); // ["project:read", "project:create", ...]
 * ```
 */
export function usePermissions(): string[] {
  const { gatehouse, subject } = useGatehouseContext();
  return useMemo(
    () => (subject ? gatehouse.permissionsFor(subject.role) : []),
    [gatehouse, subject],
  );
}

/**
 * Full access to the Gatehouse instance and current subject.
 *
 * ```ts
 * const { gatehouse, subject, loading } = useGatehouse();
 * ```
 */
export function useGatehouse() {
  return useGatehouseContext();
}
