import "server-only";

import mammoth from "mammoth";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_EXTRACTED_LENGTH = 8000; // Char limit for prompt injection

export type ExtractedDocument = {
  text: string;
  filename: string;
  extracted_length: number;
};

async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
    useWorkerFetch: false,
    isEvalSupported: false,
    stopAtErrors: false,
  });

  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const chunks: string[] = [];
      for (const item of textContent.items) {
        if ("str" in item && typeof item.str === "string" && item.str.trim()) {
          chunks.push(item.str);
        }

        if ("hasEOL" in item && item.hasEOL) {
          chunks.push("\n");
        }
      }

      pages.push(chunks.join(" "));
      await page.cleanup();
    }

    return pages.join("\n");
  } finally {
    await document.destroy();
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
      // Extract PDF directly from the uploaded bytes to avoid external binaries.
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
