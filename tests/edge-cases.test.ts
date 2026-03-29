import { describe, it, expect } from "vitest";
import { createGatehouse } from "../src/core/gatehouse.js";
import { loadCases } from "./helpers/load-cases.js";

interface EdgeTest {
  name: string;
  fn: string;
  role?: string;
  roleA?: string;
  roleB?: string;
  permission?: string;
  expected: any;
}

interface EdgeSection {
  roles: Record<string, string[]>;
  tests: EdgeTest[];
}

const cases = loadCases<{
  singleRole: EdgeSection;
  manyRoles: EdgeSection;
  emptyPermissions: EdgeSection;
  deepNamespaces: EdgeSection;
  configAccess: EdgeSection;
  specialChars: EdgeSection;
}>("edge-cases.yaml");

function runEdgeTests(sectionName: string, section: EdgeSection) {
  const gh = createGatehouse({ roles: section.roles });

  describe(sectionName, () => {
    for (const t of section.tests) {
      it(t.name, () => {
        switch (t.fn) {
          case "can":
            expect(gh.can(t.role!, t.permission!)).toBe(t.expected);
            break;
          case "isAtLeast":
            expect(gh.isAtLeast(t.roleA!, t.roleB!)).toBe(t.expected);
            break;
          case "permissionsFor":
            expect(gh.permissionsFor(t.role!)).toEqual(t.expected);
            break;
          case "rolesList":
            expect(gh.roles).toEqual(t.expected);
            break;
          case "config":
            expect(gh.config).toEqual(t.expected);
            break;
          default:
            throw new Error(`Unknown fn: ${t.fn}`);
        }
      });
    }
  });
}

runEdgeTests("single role configuration", cases.singleRole);
runEdgeTests("many roles configuration", cases.manyRoles);
runEdgeTests("roles with empty permissions", cases.emptyPermissions);
runEdgeTests("deeply nested permission namespaces", cases.deepNamespaces);
runEdgeTests("config access", cases.configAccess);
runEdgeTests("special characters in permissions", cases.specialChars);
