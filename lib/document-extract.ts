import "server-only";

import { spawnSync } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { pathToFileURL } from "url";

import mammoth from "mammoth";
// @ts-ignore - pdf-text-extract doesn't have @types package
import extract from "pdf-text-extract";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_EXTRACTED_LENGTH = 8000; // Char limit for prompt injection
let hasCheckedPdfToTextBinary = false;
let hasPdfToTextBinary = false;

export type ExtractedDocument = {
  text: string;
  filename: string;
  extracted_length: number;
};

function canUsePdfToTextBinary() {
  if (hasCheckedPdfToTextBinary) {
    return hasPdfToTextBinary;
  }

  hasCheckedPdfToTextBinary = true;

  const result = spawnSync("pdftotext", ["-v"], { stdio: "ignore" });
  hasPdfToTextBinary = !result.error;

  return hasPdfToTextBinary;
}

async function extractPdfWithPdfToText(buffer: Buffer): Promise<string> {
  // pdf-text-extract requires a file path, not a Buffer
  // Write buffer to temporary file, extract, then clean up
  const tempPath = join(tmpdir(), `pdf-extract-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);

  try {
    await writeFile(tempPath, buffer);

    const text = await new Promise<string>((resolve, reject) => {
      extract(tempPath, { splitPages: false }, (err: Error | null, pages: string[]) => {
        if (err) {
          reject(new Error(`PDF extraction error: ${err.message}`));
          return;
        }

        resolve((pages || []).join("\n"));
      });
    });

    return text;
  } finally {
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function extractPdfWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjsPath = join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const workerPath = join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");

  type PdfPage = {
    getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
    cleanup(): void;
  };

  type PdfDocument = {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  };

  type PdfJsModule = {
    getDocument(input: {
      data: Uint8Array;
      isEvalSupported: boolean;
      useSystemFonts: boolean;
    }): {
      promise: Promise<PdfDocument>;
      destroy(): Promise<void>;
    };
  };

  const pdfjs = (await import(
    /* webpackIgnore: true */
    pathToFileURL(pdfjsPath).href
  )) as PdfJsModule;
  const workerModule = (await import(
    /* webpackIgnore: true */
    pathToFileURL(workerPath).href
  )) as {
    WorkerMessageHandler: unknown;
  };

  (globalThis as typeof globalThis & {
    pdfjsWorker?: { WorkerMessageHandler?: unknown };
  }).pdfjsWorker = {
    WorkerMessageHandler: workerModule.WorkerMessageHandler,
  };

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  try {
    const document = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);

      try {
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: { str?: string }) => item.str ?? "")
          .join(" ");

        pages.push(pageText);
      } finally {
        page.cleanup();
      }
    }

    return pages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}

function shouldFallbackToPdfJs(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /spawn\s+pdftotext\s+enoent|pdftotext.*not found|enoent/i.test(message);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // Avoid crashing the process when pdf-text-extract spawns a missing binary.
  if (!canUsePdfToTextBinary()) {
    return extractPdfWithPdfJs(buffer);
  }

  try {
    return await extractPdfWithPdfToText(buffer);
  } catch (error) {
    if (!shouldFallbackToPdfJs(error)) {
      throw error;
    }

    return extractPdfWithPdfJs(buffer);
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
      // Extract PDF using pdf-text-extract (via temp file path)
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
