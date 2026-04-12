import { NextResponse } from "next/server";
import { generatedInterviewers } from "@/lib/interviewers";

export async function GET() {
  return NextResponse.json({
    interviewers: generatedInterviewers,
  });
}
