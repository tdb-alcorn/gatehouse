import { describe, it, expect } from "vitest";
import { createGatehouse } from "../src/core/gatehouse.js";
import { createServerGate, GatehouseError } from "../src/next/server.js";
import { loadCases } from "./helpers/load-cases.js";
import type { GatehouseSubject } from "../src/core/types.js";

interface ThrowSpec {
  message: string;
  status: number;
}

interface GateAuthCase {
  name: string;
  subject: GatehouseSubject | null;
  expected?: GatehouseSubject;
  throws?: ThrowSpec;
}

interface GatePermCase {
  name: string;
  subject: GatehouseSubject | null;
  permission: string;
  expected?: GatehouseSubject;
  throws?: ThrowSpec;
}

interface GateMultiCase {
  name: string;
  subject: GatehouseSubject | null;
  permissions: string[];
  expected?: GatehouseSubject;
  throws?: ThrowSpec;
}

interface GateRoleCase {
  name: string;
  subject: GatehouseSubject | null;
  requiredRole: string;
  expected?: GatehouseSubject;
  throws?: ThrowSpec;
}

interface GateCheckCase {
  name: string;
  subject: GatehouseSubject | null;
  permission: string | null;
  expected: GatehouseSubject | null;
}

const cases = loadCases<{
  roles: Record<string, string[]>;
  gateAuth: GateAuthCase[];
  gatePermission: GatePermCase[];
  gateAll: GateMultiCase[];
  gateAny: GateMultiCase[];
  gateRole: GateRoleCase[];
  gateCheck: GateCheckCase[];
}>("server-gate.yaml");

const gh = createGatehouse({ roles: cases.roles });

function makeGate(subject: GatehouseSubject | null) {
  return createServerGate({
    gatehouse: gh,
    resolve: async () => subject,
  });
}

async function expectGatehouseError(
  fn: () => Promise<any>,
  expected: ThrowSpec,
) {
  try {
    await fn();
    expect.fail("Expected GatehouseError to be thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(GatehouseError);
    expect((e as GatehouseError).message).toBe(expected.message);
    expect((e as GatehouseError).status).toBe(expected.status);
  }
}

describe("gate() - authentication only", () => {
  for (const c of cases.gateAuth) {
    it(c.name, async () => {
      const gate = makeGate(c.subject);
      if (c.throws) {
        await expectGatehouseError(() => gate(), c.throws);
      } else {
        const result = await gate();
        expect(result).toEqual(c.expected);
      }
    });
  }
});

describe("gate(permission) - single permission", () => {
  for (const c of cases.gatePermission) {
    it(c.name, async () => {
      const gate = makeGate(c.subject);
      if (c.throws) {
        await expectGatehouseError(() => gate(c.permission), c.throws);
      } else {
        const result = await gate(c.permission);
        expect(result).toEqual(c.expected);
      }
    });
  }
});

describe("gate.all(permissions)", () => {
  for (const c of cases.gateAll) {
    it(c.name, async () => {
      const gate = makeGate(c.subject);
      if (c.throws) {
        await expectGatehouseError(() => gate.all(c.permissions), c.throws);
      } else {
        const result = await gate.all(c.permissions);
        expect(result).toEqual(c.expected);
      }
    });
  }
});

describe("gate.any(permissions)", () => {
  for (const c of cases.gateAny) {
    it(c.name, async () => {
      const gate = makeGate(c.subject);
      if (c.throws) {
        await expectGatehouseError(() => gate.any(c.permissions), c.throws);
      } else {
        const result = await gate.any(c.permissions);
        expect(result).toEqual(c.expected);
      }
    });
  }
});

describe("gate.role(role)", () => {
  for (const c of cases.gateRole) {
    it(c.name, async () => {
      const gate = makeGate(c.subject);
      if (c.throws) {
        await expectGatehouseError(
          () => gate.role(c.requiredRole),
          c.throws,
        );
      } else {
        const result = await gate.role(c.requiredRole);
        expect(result).toEqual(c.expected);
      }
    });
  }
});

describe("gate.check() - soft checks", () => {
  for (const c of cases.gateCheck) {
    it(c.name, async () => {
      const gate = makeGate(c.subject);
      const result = c.permission
        ? await gate.check(c.permission)
        : await gate.check();
      if (c.expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result).toEqual(c.expected);
      }
    });
  }
});
