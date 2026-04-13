import "server-only";

import type { TextItem } from "pdfjs-dist/types/src/display/api";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let mammothModulePromise: Promise<typeof import("mammoth")> | null = null;
let pdfJsModulePromise: Promise<PdfJsModule> | null = null;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_EXTRACTED_LENGTH = 8000; // Char limit for prompt injection

export type ExtractedDocument = {
  text: string;
  filename: string;
  extracted_length: number;
};

class MinimalDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: Iterable<number> | ArrayLike<number>) {
    if (!init) {
      return;
    }

    const values = Array.from(init).map((value) => Number(value));
    if (values.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = values;
    }
  }

  multiplySelf(): this {
    return this;
  }

  preMultiplySelf(): this {
    return this;
  }

  translate(x = 0, y = 0): this {
    this.e += Number(x);
    this.f += Number(y);
    return this;
  }

  scale(scaleX = 1, scaleY = scaleX): this {
    this.a *= Number(scaleX);
    this.d *= Number(scaleY);
    return this;
  }

  invertSelf(): this {
    return this;
  }
}

function ensurePdfJsGlobals() {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
    navigator?: {
      language?: string;
      platform?: string;
      userAgent?: string;
    };
  };

  if (!globalScope.DOMMatrix) {
    globalScope.DOMMatrix = MinimalDOMMatrix as unknown as typeof DOMMatrix;
  }

  if (!globalScope.navigator?.language) {
    globalScope.navigator = {
      language: "en-US",
      platform: "",
      userAgent: "Cloudflare-Workers",
    } as Navigator;
  }
}

function loadMammoth() {
  if (!mammothModulePromise) {
    mammothModulePromise = import("mammoth");
  }

  return mammothModulePromise;
}

async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = (async () => {
      ensurePdfJsGlobals();
      return import("pdfjs-dist/legacy/build/pdf.mjs");
    })();
  }

  return pdfJsModulePromise;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { getDocument } = await loadPdfJs();
  const document = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const parts: string[] = [];
  try {
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item): item is TextItem => "str" in item)
        .map((item) => item.str)
        .join(" ");

      if (pageText.trim()) {
        parts.push(pageText);
      }
    }
  } finally {
    await document.destroy().catch(() => undefined);
  }

  return parts.join("\n");
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
      const loadedMammoth = await loadMammoth();
      const result = await loadedMammoth.extractRawText({ buffer });
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
