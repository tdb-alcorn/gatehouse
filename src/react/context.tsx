"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Gatehouse, RoleDefinitions, GatehouseSubject } from "../core/types.js";

export interface GatehouseContextValue<T extends RoleDefinitions = RoleDefinitions> {
  gatehouse: Gatehouse<T>;
  subject: GatehouseSubject | null;
  loading: boolean;
}

const GatehouseContext = createContext<GatehouseContextValue | null>(null);

export interface GatehouseProviderProps<T extends RoleDefinitions> {
  children: ReactNode;
  gatehouse: Gatehouse<T>;
  /**
   * Resolve the current user's role. Called once on mount.
   * Return `null` if user is not authenticated.
   */
  resolve: () => Promise<GatehouseSubject | null> | GatehouseSubject | null;
}

/**
 * Provide RBAC context to your app.
 *
 * ```tsx
 * <GatehouseProvider gatehouse={gh} resolve={() => ({ role: "admin" })}>
 *   {children}
 * </GatehouseProvider>
 * ```
 */
export function GatehouseProvider<T extends RoleDefinitions>({
  children,
  gatehouse,
  resolve,
}: GatehouseProviderProps<T>) {
  const [subject, setSubject] = useState<GatehouseSubject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(resolve()).then((result) => {
      if (!cancelled) {
        setSubject(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resolve]);

  return (
    <GatehouseContext.Provider
      value={{
        gatehouse: gatehouse as unknown as Gatehouse<RoleDefinitions>,
        subject,
        loading,
      }}
    >
      {children}
    </GatehouseContext.Provider>
  );
}

/** Access the Gatehouse context. Throws if used outside GatehouseProvider. */
export function useGatehouseContext(): GatehouseContextValue {
  const ctx = useContext(GatehouseContext);
  if (!ctx) {
    throw new Error("useGatehouseContext must be used within <GatehouseProvider>");
  }
  return ctx;
}
