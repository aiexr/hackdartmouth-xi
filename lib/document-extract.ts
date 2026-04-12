import "server-only";

import { writeFile, unlink } from "fs/promises";
import mammoth from "mammoth";
import { tmpdir } from "os";
import { join } from "path";
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

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-text-extract requires a file path, not a Buffer.
  const tempPath = join(
    tmpdir(),
    `pdf-extract-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
  );

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
      // Ignore cleanup errors.
    }
  }
}

export async function extractDocumentText(
  buffer: Buffer,
  filename: string,
): Promise<ExtractedDocument> {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Max: 10MB`,
    );
  }

  try {
    let text = "";

    if (ext === ".pdf") {
      text = await extractPdf(buffer);
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    }

    if (!text.trim()) {
      throw new Error("No text extracted from document");
    }

    text = text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_LENGTH);

    if (text.length >= MAX_EXTRACTED_LENGTH) {
      text += "\n[... document truncated for context length ...]";
    }

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
