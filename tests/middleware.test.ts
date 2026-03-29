import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server.js";
import { createMiddleware } from "../src/next/middleware.js";
import { loadCases } from "./helpers/load-cases.js";

interface RouteCase {
  name: string;
  path: string;
  authenticated: boolean;
  async?: boolean;
  expectedAction: "next" | "redirect" | "json401";
  redirectUrl?: string;
  redirectFrom?: string;
}

interface CustomLoginCase {
  loginUrl: string;
  protected: string[];
  test: RouteCase;
}

const cases = loadCases<{
  config: { protected: string[]; loginUrl: string };
  routeProtection: RouteCase[];
  pageRedirects: RouteCase[];
  apiUnauth: RouteCase[];
  patternEdgeCases: RouteCase[];
  customLoginUrl: CustomLoginCase;
  defaultLoginUrl: { protected: string[]; test: RouteCase };
  asyncAuth: RouteCase[];
}>("middleware.yaml");

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${path}`));
}

function makeMiddleware(
  config: { protected: string[]; loginUrl?: string },
  authenticated: boolean,
  async_?: boolean,
) {
  return createMiddleware({
    ...config,
    isAuthenticated: async_ ? async () => authenticated : () => authenticated,
  });
}

async function assertAction(
  response: NextResponse,
  expected: RouteCase,
) {
  switch (expected.expectedAction) {
    case "next":
      // NextResponse.next() has no location header and 200 status
      expect(response.headers.get("location")).toBeNull();
      expect(response.status).toBe(200);
      break;
    case "redirect":
      expect(response.status).toBeGreaterThanOrEqual(300);
      expect(response.status).toBeLessThan(400);
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe(expected.redirectUrl ?? "/login");
      if (expected.redirectFrom) {
        expect(location.searchParams.get("from")).toBe(expected.redirectFrom);
      }
      break;
    case "json401":
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
      break;
  }
}

describe("route protection", () => {
  for (const c of cases.routeProtection) {
    it(c.name, async () => {
      const mw = makeMiddleware(cases.config, c.authenticated);
      const res = await mw(makeRequest(c.path));
      await assertAction(res, c);
    });
  }
});

describe("page redirects for unauthenticated users", () => {
  for (const c of cases.pageRedirects) {
    it(c.name, async () => {
      const mw = makeMiddleware(cases.config, c.authenticated);
      const res = await mw(makeRequest(c.path));
      await assertAction(res, c);
    });
  }
});

describe("API routes return 401 for unauthenticated", () => {
  for (const c of cases.apiUnauth) {
    it(c.name, async () => {
      const mw = makeMiddleware(cases.config, c.authenticated);
      const res = await mw(makeRequest(c.path));
      await assertAction(res, c);
    });
  }
});

describe("pattern matching edge cases", () => {
  for (const c of cases.patternEdgeCases) {
    it(c.name, async () => {
      const mw = makeMiddleware(cases.config, c.authenticated);
      const res = await mw(makeRequest(c.path));
      await assertAction(res, c);
    });
  }
});

describe("custom login URL", () => {
  const c = cases.customLoginUrl;
  it(c.test.name ?? "redirects to custom login URL", async () => {
    const mw = makeMiddleware(
      { protected: c.protected, loginUrl: c.loginUrl },
      c.test.authenticated,
    );
    const res = await mw(makeRequest(c.test.path));
    await assertAction(res, { ...c.test, redirectUrl: c.loginUrl });
  });
});

describe("default login URL", () => {
  const c = cases.defaultLoginUrl;
  it(c.test.name ?? "uses /login as default", async () => {
    const mw = makeMiddleware({ protected: c.protected }, c.test.authenticated);
    const res = await mw(makeRequest(c.test.path));
    await assertAction(res, c.test);
  });
});

describe("async isAuthenticated", () => {
  for (const c of cases.asyncAuth) {
    it(c.name, async () => {
      const mw = makeMiddleware(cases.config, c.authenticated, c.async);
      const res = await mw(makeRequest(c.path));
      await assertAction(res, c);
    });
  }
});
