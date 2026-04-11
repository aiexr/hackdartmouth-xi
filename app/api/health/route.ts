import { NextResponse } from "next/server";
import { env, envFlags } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: env.appName,
    integrations: envFlags,
    timestamp: new Date().toISOString(),
  });
}
