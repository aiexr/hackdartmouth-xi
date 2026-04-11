import { initializeAllIndexes } from "@/lib/models";

export async function GET() {
  try {
    await initializeAllIndexes();
    return Response.json({ success: true, message: "MongoDB indexes initialized" });
  } catch (error) {
    console.error("Failed to initialize indexes:", error);
    return Response.json(
      { success: false, error: "Failed to initialize indexes" },
      { status: 500 }
    );
  }
}
