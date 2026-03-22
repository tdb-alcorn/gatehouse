import { NextResponse } from "next/server";
import { withGate } from "gatehouse/next";
import { gate } from "@/lib/gate";

export const GET = withGate(async () => {
  await gate("project:read");
  return NextResponse.json({ projects: [] });
});

export const POST = withGate(async () => {
  const subject = await gate("project:create");
  // subject.role is guaranteed to have project:create permission
  return NextResponse.json({ created: true, by: subject.role });
});
