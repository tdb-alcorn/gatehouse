import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { createGatehouse } from "../src/core/gatehouse.js";
import { GatehouseProvider } from "../src/react/context.js";
import { Gate } from "../src/react/gate.js";
import { useGate, useRole, usePermissions } from "../src/react/hooks.js";
import { loadCases } from "./helpers/load-cases.js";
import type { GatehouseSubject } from "../src/core/types.js";

interface GateCase {
  name: string;
  subject?: GatehouseSubject | null;
  loading?: boolean;
  props: {
    allow?: string;
    allOf?: string[];
    anyOf?: string[];
    role?: string;
  };
  expectedContent: "children" | "fallback" | "loading" | "empty";
}

interface UseGateCase {
  name: string;
  subject: GatehouseSubject | null;
  permission: string;
  expected: boolean;
}

interface UseRoleCase {
  name: string;
  subject: GatehouseSubject | null;
  expected: string | null;
}

interface UsePermissionsCase {
  name: string;
  subject: GatehouseSubject | null;
  expected: string[];
}

const cases = loadCases<{
  roles: Record<string, string[]>;
  gateAllow: GateCase[];
  gateAllOf: GateCase[];
  gateAnyOf: GateCase[];
  gateRole: GateCase[];
  gateCombined: GateCase[];
  gateLoading: GateCase[];
  useGate: UseGateCase[];
  useRole: UseRoleCase[];
  usePermissions: UsePermissionsCase[];
}>("react-gate.yaml");

const gh = createGatehouse({ roles: cases.roles });

async function renderGate(
  c: GateCase,
  opts?: { hasFallback?: boolean; hasLoading?: boolean },
) {
  const hasFallback = opts?.hasFallback ?? c.expectedContent === "fallback";
  const hasLoading = opts?.hasLoading ?? c.expectedContent === "loading";

  const subject = c.subject === undefined ? null : c.subject;
  const isLoading = c.loading ?? false;

  // For loading tests, use a resolve that never settles
  const resolve = isLoading
    ? () => new Promise<GatehouseSubject | null>(() => {})
    : () => subject;

  await act(async () => {
    render(
      <GatehouseProvider gatehouse={gh} resolve={resolve}>
        <Gate
          {...c.props}
          fallback={
            hasFallback ? (
              <div data-testid="fallback">Denied</div>
            ) : undefined
          }
          loading={
            hasLoading ? (
              <div data-testid="loading">Loading...</div>
            ) : undefined
          }
        >
          <div data-testid="children">Allowed</div>
        </Gate>
      </GatehouseProvider>,
    );
  });
}

function assertContent(expected: GateCase["expectedContent"]) {
  switch (expected) {
    case "children":
      expect(screen.getByTestId("children")).toBeTruthy();
      expect(screen.queryByTestId("fallback")).toBeNull();
      expect(screen.queryByTestId("loading")).toBeNull();
      break;
    case "fallback":
      expect(screen.getByTestId("fallback")).toBeTruthy();
      expect(screen.queryByTestId("children")).toBeNull();
      break;
    case "loading":
      expect(screen.getByTestId("loading")).toBeTruthy();
      expect(screen.queryByTestId("children")).toBeNull();
      expect(screen.queryByTestId("fallback")).toBeNull();
      break;
    case "empty":
      expect(screen.queryByTestId("children")).toBeNull();
      expect(screen.queryByTestId("fallback")).toBeNull();
      expect(screen.queryByTestId("loading")).toBeNull();
      break;
  }
}

async function renderHook<T>(
  subject: GatehouseSubject | null,
  hook: () => T,
): Promise<T> {
  let result: T;

  function HookConsumer() {
    result = hook();
    return null;
  }

  await act(async () => {
    render(
      <GatehouseProvider gatehouse={gh} resolve={() => subject}>
        <HookConsumer />
      </GatehouseProvider>,
    );
  });

  return result!;
}

describe("Gate with allow (single permission)", () => {
  for (const c of cases.gateAllow) {
    it(c.name, async () => {
      await renderGate(c);
      assertContent(c.expectedContent);
    });
  }
});

describe("Gate with allOf", () => {
  for (const c of cases.gateAllOf) {
    it(c.name, async () => {
      await renderGate(c);
      assertContent(c.expectedContent);
    });
  }
});

describe("Gate with anyOf", () => {
  for (const c of cases.gateAnyOf) {
    it(c.name, async () => {
      await renderGate(c);
      assertContent(c.expectedContent);
    });
  }
});

describe("Gate with role", () => {
  for (const c of cases.gateRole) {
    it(c.name, async () => {
      await renderGate(c);
      assertContent(c.expectedContent);
    });
  }
});

describe("Gate with combined checks", () => {
  for (const c of cases.gateCombined) {
    it(c.name, async () => {
      await renderGate(c);
      assertContent(c.expectedContent);
    });
  }
});

describe("Gate loading state", () => {
  for (const c of cases.gateLoading) {
    it(c.name, async () => {
      await renderGate(c, {
        hasLoading: c.expectedContent === "loading",
        hasFallback: false,
      });
      assertContent(c.expectedContent);
    });
  }
});

describe("useGate hook", () => {
  for (const c of cases.useGate) {
    it(c.name, async () => {
      const result = await renderHook(c.subject, () => useGate(c.permission));
      expect(result).toBe(c.expected);
    });
  }
});

describe("useRole hook", () => {
  for (const c of cases.useRole) {
    it(c.name, async () => {
      const result = await renderHook(c.subject, () => useRole());
      expect(result).toBe(c.expected);
    });
  }
});

describe("usePermissions hook", () => {
  for (const c of cases.usePermissions) {
    it(c.name, async () => {
      const result = await renderHook(c.subject, () => usePermissions());
      expect(result).toEqual(c.expected);
    });
  }
});

describe("useGatehouseContext outside provider", () => {
  it("throws when used outside GatehouseProvider", () => {
    expect(() => {
      render(
        <Gate allow="test">
          <div>test</div>
        </Gate>,
      );
    }).toThrow("useGatehouseContext must be used within <GatehouseProvider>");
  });
});
