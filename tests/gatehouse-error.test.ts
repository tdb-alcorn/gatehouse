import { describe, it, expect } from "vitest";
import { GatehouseError } from "../src/next/server.js";
import { loadCases } from "./helpers/load-cases.js";

interface ErrorCase {
  name: string;
  message: string;
  status: number;
  expectedName: string;
  instanceOfError?: boolean;
}

const cases = loadCases<{ cases: ErrorCase[] }>("gatehouse-error.yaml");

describe("GatehouseError", () => {
  for (const c of cases.cases) {
    it(c.name, () => {
      const error = new GatehouseError(c.message, c.status);
      expect(error.message).toBe(c.message);
      expect(error.status).toBe(c.status);
      expect(error.name).toBe(c.expectedName);

      if (c.instanceOfError) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  }
});
