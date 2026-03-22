"use client";

import type { ReactNode } from "react";
import { useGatehouseContext } from "./context.js";

export interface GateProps {
  children: ReactNode;
  /**
   * Permission required. e.g. "project:create"
   * Use `allow` for single permission, `allOf` for all, `anyOf` for any.
   */
  allow?: string;
  /** Require ALL of these permissions. */
  allOf?: string[];
  /** Require ANY of these permissions. */
  anyOf?: string[];
  /** Require this role or higher. */
  role?: string;
  /** Shown when permission is denied. */
  fallback?: ReactNode;
  /** Shown while resolve() is loading. */
  loading?: ReactNode;
}

/**
 * Declarative permission gate.
 *
 * ```tsx
 * <Gate allow="project:create">
 *   <CreateButton />
 * </Gate>
 *
 * <Gate role="admin" fallback={<p>Admin only</p>}>
 *   <AdminPanel />
 * </Gate>
 *
 * <Gate anyOf={["project:edit", "project:delete"]}>
 *   <EditMenu />
 * </Gate>
 * ```
 */
export function Gate({
  children,
  allow,
  allOf,
  anyOf,
  role,
  fallback = null,
  loading: loadingFallback = null,
}: GateProps) {
  const { gatehouse, subject, loading } = useGatehouseContext();

  if (loading) return <>{loadingFallback}</>;
  if (!subject) return <>{fallback}</>;

  // Role check
  if (role && !gatehouse.isAtLeast(subject.role, role)) {
    return <>{fallback}</>;
  }

  // Single permission
  if (allow && !gatehouse.can(subject, allow)) {
    return <>{fallback}</>;
  }

  // All permissions
  if (allOf && !gatehouse.canAll(subject, allOf)) {
    return <>{fallback}</>;
  }

  // Any permission
  if (anyOf && !gatehouse.canAny(subject, anyOf)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
