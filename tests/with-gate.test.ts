import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server.js";
import { withGate } from "../src/next/catch.js";
import { GatehouseError } from "../src/next/server.js";
import { loadCases } from "./helpers/load-cases.js";

interface WithGateCase {
  name: string;
  handler: string;
  expectedStatus?: number;
  expectedBody?: any;
  throws?: string;
}

const cases = loadCases<{ cases: WithGateCase[] }>("with-gate.yaml");

const handlers: Record<string, (req: Request) => Promise<Response>> = {
  success: async () => NextResponse.json({ ok: true }, { status: 200 }),
  throw401: async () => {
    throw new GatehouseError("Unauthorized", 401);
  },
  throw403: async () => {
    throw new GatehouseError("Forbidden", 403);
  },
  throwGeneric: async () => {
    throw new Error("Something else");
  },
  echoMethod: async (req) =>
    NextResponse.json({ method: req.method }, { status: 200 }),
};

describe("withGate", () => {
  for (const c of cases.cases) {
    it(c.name, async () => {
      const handler = handlers[c.handler];
      const wrapped = withGate(handler);
      const request = new Request("http://localhost/test", { method: "POST" });

      if (c.throws) {
        await expect(wrapped(request)).rejects.toThrow(c.throws);
      } else {
        const response = await wrapped(request);
        expect(response.status).toBe(c.expectedStatus);
        const body = await response.json();
        expect(body).toEqual(c.expectedBody);
      }
    });
  }
});
