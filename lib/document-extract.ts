import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_EXTRACTED_LENGTH = 8000; // Char limit for prompt injection
let pdfWorkerReady: Promise<void> | null = null;

export type ExtractedDocument = {
  text: string;
  filename: string;
  extracted_length: number;
};

async function ensurePdfJsWorker() {
  const workerState = globalThis as typeof globalThis & {
    pdfjsWorker?: { WorkerMessageHandler?: unknown };
  };

  if (workerState.pdfjsWorker?.WorkerMessageHandler) {
    return;
  }

  if (!pdfWorkerReady) {
    pdfWorkerReady = import(
      // pdf-parse bundles its own pdfjs version, so we preload the matching worker.
      // @ts-expect-error - nested bundled worker has no public types entry.
      "../node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
    )
      .then(({ WorkerMessageHandler }) => {
        workerState.pdfjsWorker = { WorkerMessageHandler };
      })
      .catch((error) => {
        pdfWorkerReady = null;
        throw error;
      });
  }

  await pdfWorkerReady;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  await ensurePdfJsWorker();

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

function normalizeExtractedText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_EXTRACTED_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_EXTRACTED_LENGTH)}\n[... document truncated for context length ...]`;
}

export async function extractDocumentText(
  buffer: Buffer,
  filename: string,
): Promise<ExtractedDocument> {
  // Validate file extension
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Max: 10MB`,
    );
  }

  try {
    let text = "";

    if (ext === ".pdf") {
      // Extract PDF text in-process so uploads work in worker runtimes.
      text = await extractPdf(buffer);
    } else if (ext === ".docx") {
      // Extract Word doc using mammoth
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    }

    if (!text.trim()) {
      throw new Error("No text extracted from document");
    }

    text = normalizeExtractedText(text);

    return {
      text,
      filename,
      extracted_length: text.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Document extraction failed: ${message}`);
  }
}

export function formatDocumentContextForPrompt(doc: ExtractedDocument): string {
  return [
    "---",
    "## Document Context",
    `Source: ${doc.filename}`,
    "---",
    doc.text,
    "---",
  ].join("\n");
}
