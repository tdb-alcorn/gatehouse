import { createServerGate } from "gatehouse/next";
import { clerkResolver } from "gatehouse/adapters/clerk";
import { gh } from "./gatehouse";

export const gate = createServerGate({
  gatehouse: gh,
  resolve: clerkResolver(),
});
