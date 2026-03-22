/** A permission string like "project:read" or "project:*" or "*" */
export type PermissionPattern = string;

/** Role-to-permissions mapping. Keys are role names, values are permission arrays. */
export type RoleDefinitions = Record<string, readonly PermissionPattern[]>;

/**
 * Extract all concrete permission strings from a role definitions object.
 * Excludes wildcards — those are matching patterns, not concrete permissions.
 */
export type ExtractPermissions<T extends RoleDefinitions> =
  T[keyof T][number] extends infer P
    ? P extends `${string}*`
      ? never
      : P extends string
        ? P
        : never
    : never;

/** Extract role names from a role definitions object. */
export type ExtractRoles<T extends RoleDefinitions> = keyof T & string;

/** The resolved identity for permission checks. */
export interface GatehouseSubject<R extends string = string> {
  role: R;
  /** Optional extra permissions beyond what the role grants. */
  permissions?: string[];
}

/** Configuration for createGatehouse(). */
export interface GatehouseConfig<T extends RoleDefinitions> {
  /** Role definitions. First role is highest rank. Order defines hierarchy. */
  roles: T;
}

/** The Gatehouse instance returned by createGatehouse(). */
export interface Gatehouse<T extends RoleDefinitions> {
  /** Check if a role (or subject) has a specific permission. */
  can: (
    roleOrSubject: ExtractRoles<T> | GatehouseSubject<ExtractRoles<T>>,
    permission: string,
  ) => boolean;

  /** Check if a role has ALL listed permissions. */
  canAll: (
    roleOrSubject: ExtractRoles<T> | GatehouseSubject<ExtractRoles<T>>,
    permissions: string[],
  ) => boolean;

  /** Check if a role has ANY of the listed permissions. */
  canAny: (
    roleOrSubject: ExtractRoles<T> | GatehouseSubject<ExtractRoles<T>>,
    permissions: string[],
  ) => boolean;

  /** Check if roleA is at least as high as roleB in the hierarchy. */
  isAtLeast: (roleA: ExtractRoles<T>, roleB: ExtractRoles<T>) => boolean;

  /** Get all concrete permissions for a role. */
  permissionsFor: (role: ExtractRoles<T>) => string[];

  /** Ordered role names from highest to lowest. */
  roles: ExtractRoles<T>[];

  /** The raw role definitions. */
  config: T;
}
