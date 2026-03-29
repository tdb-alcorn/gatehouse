import { describe, it, expect } from "vitest";
import { matchesPermission, hasPermission } from "../src/core/permissions.js";
import { loadCases } from "./helpers/load-cases.js";

interface MatchCase {
  name: string;
  args: [string, string];
  expected: boolean;
}

interface HasPermCase {
  name: string;
  args: [string[], string];
  expected: boolean;
}

const cases = loadCases<{
  matchesPermission: MatchCase[];
  hasPermission: HasPermCase[];
}>("permission-matching.yaml");

describe("matchesPermission", () => {
  for (const c of cases.matchesPermission) {
    it(c.name, () => {
      expect(matchesPermission(c.args[0], c.args[1])).toBe(c.expected);
    });
  }
});

describe("hasPermission", () => {
  for (const c of cases.hasPermission) {
    it(c.name, () => {
      expect(hasPermission(c.args[0], c.args[1])).toBe(c.expected);
    });
  }
});
