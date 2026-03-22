# Gatehouse

Drop-in RBAC for Next.js. Define roles once, protect everything.

```bash
npm install gatehouse
```

## Quick Start

### 1. Define your roles (one file, once)

```ts
// lib/gatehouse.ts
import { createGatehouse } from "gatehouse";

export const gh = createGatehouse({
  roles: {
    owner:  ["*"],
    admin:  ["project:*", "member:invite", "member:remove"],
    member: ["project:read", "project:create", "task:*"],
    viewer: ["project:read", "task:read"],
  },
});
```

Roles are hierarchical — first is highest. Wildcards work: `project:*` matches `project:read`, `project:create`, etc. `*` matches everything.

### 2. Protect your UI

```tsx
import { Gate } from "gatehouse/react";

<Gate allow="project:create">
  <CreateButton />
</Gate>

<Gate role="admin" fallback={<span>Admin only</span>}>
  <AdminPanel />
</Gate>
```

### 3. Protect your API routes

```ts
// lib/gate.ts
import { createServerGate } from "gatehouse/next";
import { gh } from "./gatehouse";
import { auth } from "./auth";

export const gate = createServerGate({
  gatehouse: gh,
  resolve: async () => {
    const session = await auth();
    if (!session) return null;
    return { role: session.user.role };
  },
});
```

```ts
// app/api/projects/route.ts
import { withGate } from "gatehouse/next";
import { gate } from "@/lib/gate";

export const POST = withGate(async () => {
  await gate("project:create");
  return Response.json({ ok: true });
});
```

That's it. Three files, working RBAC.

---

## Auth Provider Adapters

### Clerk

```ts
import { createServerGate } from "gatehouse/next";
import { clerkResolver } from "gatehouse/adapters/clerk";
import { gh } from "./gatehouse";

export const gate = createServerGate({
  gatehouse: gh,
  resolve: clerkResolver(), // reads from publicMetadata.role
});
```

### Supabase

```ts
import { createServerGate } from "gatehouse/next";
import { supabaseResolver } from "gatehouse/adapters/supabase";
import { gh } from "./gatehouse";
import { createClient } from "@/lib/supabase/server";

export const gate = createServerGate({
  gatehouse: gh,
  resolve: supabaseResolver({ createClient }),
});
```

### Auth.js (NextAuth)

```ts
import { createServerGate } from "gatehouse/next";
import { authjsResolver } from "gatehouse/adapters/authjs";
import { gh } from "./gatehouse";
import { auth } from "./auth";

export const gate = createServerGate({
  gatehouse: gh,
  resolve: authjsResolver({ auth }),
});
```

---

## React Components & Hooks

### `<GatehouseProvider>`

Wrap your app to provide RBAC context:

```tsx
// app/layout.tsx
import { GatehouseProvider } from "gatehouse/react";
import { gh } from "@/lib/gatehouse";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GatehouseProvider
      gatehouse={gh}
      resolve={async () => {
        const res = await fetch("/api/me");
        if (!res.ok) return null;
        return res.json(); // { role: "admin" }
      }}
    >
      {children}
    </GatehouseProvider>
  );
}
```

### `<Gate>`

Declarative permission gate:

```tsx
import { Gate } from "gatehouse/react";

// Single permission
<Gate allow="project:create">
  <CreateButton />
</Gate>

// Role check
<Gate role="admin">
  <AdminPanel />
</Gate>

// Multiple permissions (all required)
<Gate allOf={["project:edit", "project:delete"]}>
  <DangerZone />
</Gate>

// Multiple permissions (any sufficient)
<Gate anyOf={["project:edit", "project:create"]}>
  <EditMenu />
</Gate>

// With fallback and loading state
<Gate allow="billing:manage" fallback={<UpgradePrompt />} loading={<Skeleton />}>
  <BillingDashboard />
</Gate>
```

### Hooks

```tsx
import { useGate, useRole, usePermissions, useGatehouse } from "gatehouse/react";

function MyComponent() {
  const canCreate = useGate("project:create");
  const role = useRole();           // "admin" | null
  const perms = usePermissions();   // ["project:*", "member:invite", ...]
  const { gatehouse, subject, loading } = useGatehouse();
}
```

---

## Next.js Middleware

Protect routes at the edge:

```ts
// middleware.ts
import { createMiddleware } from "gatehouse/next";

export default createMiddleware({
  protected: ["/dashboard/:path*", "/api/projects/:path*"],
  isAuthenticated: (req) => !!req.cookies.get("session"),
  loginUrl: "/login", // default
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/projects/:path*"],
};
```

---

## Server-Side Gate API

```ts
import { gate } from "@/lib/gate";

// Require authentication (throws 401 if not logged in)
const subject = await gate();

// Require specific permission (throws 403 if denied)
const subject = await gate("project:create");

// Require all permissions
const subject = await gate.all(["project:edit", "project:delete"]);

// Require any permission
const subject = await gate.any(["project:edit", "project:create"]);

// Require minimum role
const subject = await gate.role("admin");

// Soft check (returns null instead of throwing)
const subject = await gate.check("project:create");
```

---

## Core API (Framework-Agnostic)

Use Gatehouse without React or Next.js:

```ts
import { createGatehouse } from "gatehouse";

const gh = createGatehouse({
  roles: {
    owner:  ["*"],
    admin:  ["project:*", "member:invite"],
    member: ["project:read", "task:*"],
    viewer: ["project:read", "task:read"],
  },
});

gh.can("admin", "project:create");        // true (matches project:*)
gh.can("viewer", "project:create");       // false
gh.canAll("member", ["task:read", "task:create"]); // true
gh.canAny("viewer", ["task:create", "project:read"]); // true
gh.isAtLeast("admin", "member");          // true
gh.isAtLeast("viewer", "admin");          // false
gh.permissionsFor("admin");               // ["project:*", "member:invite"]
gh.roles;                                 // ["owner", "admin", "member", "viewer"]
```

---

## Wildcard Permissions

```
"*"           → matches everything
"project:*"   → matches project:read, project:create, project:delete, etc.
"project:read" → exact match only
```

---

## Role Hierarchy

Roles are ordered by definition — first role is highest rank:

```ts
const gh = createGatehouse({
  roles: {
    owner:  ["*"],          // rank 0 (highest)
    admin:  ["project:*"],  // rank 1
    member: ["task:*"],     // rank 2
    viewer: ["task:read"],  // rank 3 (lowest)
  },
});

gh.isAtLeast("owner", "admin");   // true — owner outranks admin
gh.isAtLeast("viewer", "member"); // false — viewer is below member
```

---

## TypeScript

Full type inference from your config:

```ts
const gh = createGatehouse({
  roles: {
    owner: ["*"],
    admin: ["project:*"],
    viewer: ["project:read"],
  },
});

// gh.can() only accepts roles you defined
gh.can("owner", "anything");  // OK
gh.can("superadmin", "x");    // Type error: "superadmin" is not a valid role
```

## License

MIT
