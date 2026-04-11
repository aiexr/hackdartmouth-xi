import { NextResponse } from "next/server";
import { APP_NAME, envFlags } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: APP_NAME,
    integrations: envFlags,
    timestamp: new Date().toISOString(),
  });
}
