import { initializeAllIndexes } from "@/lib/models";

const INIT_TIMEOUT_MS = 4500;
let initializeIndexesPromise: Promise<void> | null = null;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function GET() {
  try {
    if (!initializeIndexesPromise) {
      initializeIndexesPromise = initializeAllIndexes();
    }
    await withTimeout(
      initializeIndexesPromise,
      INIT_TIMEOUT_MS,
      "MongoDB index initialization timed out.",
    );
    return Response.json({ success: true, message: "MongoDB indexes initialized" });
  } catch (error) {
    initializeIndexesPromise = null;
    console.error("Failed to initialize indexes:", error);
    return Response.json(
      { success: false, error: "Failed to initialize indexes" },
      { status: 202 },
    );
  }
}
