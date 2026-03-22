import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/react.tsx",
    "src/next.ts",
    "src/adapters/clerk.ts",
    "src/adapters/supabase.ts",
    "src/adapters/authjs.ts",
  ],
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  external: ["react", "next", "@clerk/nextjs", "@supabase/supabase-js", "next-auth"],
});
