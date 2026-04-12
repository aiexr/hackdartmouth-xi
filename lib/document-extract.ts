import "server-only";

import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

import mammoth from "mammoth";
// @ts-ignore - pdf-text-extract doesn't have @types package
import extract from "pdf-text-extract";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_EXTRACTED_LENGTH = 8000; // Char limit for prompt injection

export type ExtractedDocument = {
  text: string;
  filename: string;
  extracted_length: number;
};

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

async function extractPdfWithPdfParse(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

function shouldFallbackToPdfParse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /spawn\s+pdftotext\s+enoent|pdftotext.*not found|enoent/i.test(message);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    return await extractPdfWithPdfToText(buffer);
  } catch (error) {
    if (!shouldFallbackToPdfParse(error)) {
      throw error;
    }

    return extractPdfWithPdfParse(buffer);
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
