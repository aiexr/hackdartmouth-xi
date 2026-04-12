import { NextResponse } from "next/server";
import { AUTH_PREVIEW_COOKIE } from "@/components/app/dashboard-preview";

export async function POST() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "cache-control": "no-store, max-age=0",
      "set-cookie": `${AUTH_PREVIEW_COOKIE}=1; Max-Age=60; Path=/; SameSite=Lax`,
    },
  });
}
