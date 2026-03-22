import { NextResponse, type NextRequest } from "next/server.js";

export interface GatehouseMiddlewareConfig {
  /**
   * Routes that require authentication. Supports Next.js matcher patterns.
   * e.g. ["/dashboard/:path*", "/api/projects/:path*"]
   */
  protected: string[];
  /** Where to redirect unauthenticated users. Default: "/login" */
  loginUrl?: string;
  /**
   * Check if the request is authenticated.
   * Return true if authenticated, false otherwise.
   */
  isAuthenticated: (request: NextRequest) => boolean | Promise<boolean>;
}

/**
 * Create a Next.js middleware that protects routes.
 *
 * ```ts
 * // middleware.ts
 * import { createMiddleware } from "gatehouse/next";
 *
 * export default createMiddleware({
 *   protected: ["/dashboard/:path*", "/api/projects/:path*"],
 *   isAuthenticated: (req) => !!req.cookies.get("session"),
 * });
 *
 * export const config = {
 *   matcher: ["/dashboard/:path*", "/api/projects/:path*"],
 * };
 * ```
 */
export function createMiddleware(options: GatehouseMiddlewareConfig) {
  const loginUrl = options.loginUrl ?? "/login";

  return async function middleware(request: NextRequest) {
    const isProtected = options.protected.some((pattern) => {
      const regex = patternToRegex(pattern);
      return regex.test(request.nextUrl.pathname);
    });

    if (!isProtected) {
      return NextResponse.next();
    }

    const authenticated = await options.isAuthenticated(request);

    if (!authenticated) {
      // API routes get 401, pages get redirected
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = request.nextUrl.clone();
      url.pathname = loginUrl;
      url.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  };
}

/** Convert a Next.js-style route pattern to a regex. */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:path\\\*/g, ".*")    // :path* → .*
    .replace(/:\\w+/g, "[^/]+");     // :id → [^/]+
  return new RegExp(`^${escaped}$`);
}
