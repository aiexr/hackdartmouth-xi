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

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-text-extract requires a file path, not a Buffer
  // Write buffer to temporary file, extract, then clean up
  const tempPath = join(tmpdir(), `pdf-extract-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);

  try {
    // Write buffer to temporary file
    await writeFile(tempPath, buffer);

    // Extract PDF using pdf-text-extract
    const text = await new Promise<string>((resolve, reject) => {
      extract(tempPath, { splitPages: false }, (err: Error | null, pages: string[]) => {
        if (err) {
          reject(new Error(`PDF extraction error: ${err.message}`));
          return;
        }

        const text = (pages || []).join("\n");
        resolve(text);
      });
    });

    return text;
  } finally {
    // Clean up temporary file
    try {
      await unlink(tempPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
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

    // Normalize whitespace and truncate
    text = text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_LENGTH);

    // If truncated, add indicator
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
