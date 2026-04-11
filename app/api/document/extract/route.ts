import { NextRequest, NextResponse } from "next/server";
import { extractDocumentText } from "@/lib/document-extract";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDocumentText(buffer, file.name);

    return NextResponse.json({
      text: extracted.text,
      filename: extracted.filename,
      extracted_length: extracted.extracted_length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
