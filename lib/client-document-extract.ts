import type { TextItem } from "pdfjs-dist/types/src/display/api";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_EXTRACTED_LENGTH = 8000; // Char limit for prompt injection

type PdfJsWorkerGlobal = typeof globalThis & {
  pdfjsWorker?: {
    WorkerMessageHandler: unknown;
  };
};

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

export type ExtractedDocument = {
  text: string;
  filename: string;
  extracted_length: number;
};

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;
let mammothModulePromise: Promise<typeof import("mammoth")> | null = null;

function normalizeExtractedText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_EXTRACTED_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_EXTRACTED_LENGTH)}\n[... document truncated for context length ...]`;
}

async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = (async () => {
      const [pdfModule, workerModule] = await Promise.all([
        import("pdfjs-dist/legacy/build/pdf.mjs"),
        import("pdfjs-dist/legacy/build/pdf.worker.mjs"),
      ]);

      (globalThis as PdfJsWorkerGlobal).pdfjsWorker ??= {
        WorkerMessageHandler: workerModule.WorkerMessageHandler,
      };

      return pdfModule;
    })();
  }

  return pdfJsModulePromise;
}

async function loadMammoth() {
  if (!mammothModulePromise) {
    mammothModulePromise = import("mammoth");
  }

  return mammothModulePromise;
}

async function extractPdf(file: File) {
  const { getDocument } = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const doc = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const parts: string[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
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
    await doc.destroy().catch(() => undefined);
  }

  return parts.join("\n");
}

async function extractDocx(file: File) {
  const mammoth = await loadMammoth();
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || "";
}

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export async function extractDocumentTextInBrowser(file: File): Promise<ExtractedDocument> {
  const ext = getExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`,
    );
  }

  let text = "";

  if (ext === ".pdf") {
    text = await extractPdf(file);
  } else if (ext === ".docx") {
    text = await extractDocx(file);
  }

  if (!text.trim()) {
    throw new Error("No text extracted from document");
  }

  text = normalizeExtractedText(text);

  return {
    text,
    filename: file.name,
    extracted_length: text.length,
  };
}
