import { describe, it, expect } from "vitest";
import { createGatehouse } from "../src/core/gatehouse.js";
import { loadCases } from "./helpers/load-cases.js";
import type { GatehouseSubject } from "../src/core/types.js";

interface CanCase {
  name: string;
  role: string;
  permission: string;
  expected: boolean;
}

interface CanSubjectCase {
  name: string;
  subject: GatehouseSubject;
  permission: string;
  expected: boolean;
}

interface CanMultiCase {
  name: string;
  role: string;
  permissions: string[];
  expected: boolean;
}

interface IsAtLeastCase {
  name: string;
  roleA: string;
  roleB: string;
  expected: boolean;
}

interface PermissionsForCase {
  name: string;
  role: string;
  expected: string[];
}

const cases = loadCases<{
  roles: Record<string, string[]>;
  can: CanCase[];
  canSubject: CanSubjectCase[];
  canAll: CanMultiCase[];
  canAny: CanMultiCase[];
  isAtLeast: IsAtLeastCase[];
  permissionsFor: PermissionsForCase[];
  rolesList: { expected: string[] };
}>("gatehouse-core.yaml");

const gh = createGatehouse({ roles: cases.roles });

describe("can (string role)", () => {
  for (const c of cases.can) {
    it(c.name, () => {
      expect(gh.can(c.role, c.permission)).toBe(c.expected);
    });
  }
});

describe("can (subject with extra permissions)", () => {
  for (const c of cases.canSubject) {
    it(c.name, () => {
      expect(gh.can(c.subject, c.permission)).toBe(c.expected);
    });
  }
});

describe("canAll", () => {
  for (const c of cases.canAll) {
    it(c.name, () => {
      expect(gh.canAll(c.role, c.permissions)).toBe(c.expected);
    });
  }
});

describe("canAny", () => {
  for (const c of cases.canAny) {
    it(c.name, () => {
      expect(gh.canAny(c.role, c.permissions)).toBe(c.expected);
    });
  }
});

describe("isAtLeast", () => {
  for (const c of cases.isAtLeast) {
    it(c.name, () => {
      expect(gh.isAtLeast(c.roleA, c.roleB)).toBe(c.expected);
    });
  }
});

describe("permissionsFor", () => {
  for (const c of cases.permissionsFor) {
    it(c.name, () => {
      expect(gh.permissionsFor(c.role)).toEqual(c.expected);
    });
  }
});

describe("roles list", () => {
  it("returns roles in declaration order", () => {
    expect(gh.roles).toEqual(cases.rolesList.expected);
  });
});
