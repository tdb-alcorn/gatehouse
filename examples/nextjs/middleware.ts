import { createMiddleware } from "gatehouse/next";

export default createMiddleware({
  protected: ["/dashboard/:path*", "/api/projects/:path*"],
  isAuthenticated: (req) => !!req.cookies.get("session"),
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/projects/:path*"],
};
