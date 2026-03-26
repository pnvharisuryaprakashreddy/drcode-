import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export type ParsedDocument = {
  rawText: string;
  wordCount: number;
  pageCount: number;
};

export type ParseInput = {
  buffer: Buffer;
  mimeType?: string;
  fileName?: string;
};

function normalizeText(text: string): string {
  // Normalize line endings and collapse excessive whitespace without destroying paragraph structure.
  const withEols = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const withoutTabs = withEols.replace(/\t+/g, " ");
  const collapsedSpaces = withoutTabs.replace(/[ ]{2,}/g, " ");
  const collapsedNewlines = collapsedSpaces.replace(/\n{3,}/g, "\n\n");
  return collapsedNewlines.trim();
}

function countWords(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  const tokens = normalized.split(/\s+/g).filter(Boolean);
  return tokens.length;
}

function extensionFromName(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const parts = fileName.toLowerCase().split(".");
  return parts.length >= 2 ? parts[parts.length - 1] : undefined;
}

function isPdf(input: ParseInput): boolean {
  const ext = extensionFromName(input.fileName);
  return input.mimeType === "application/pdf" || ext === "pdf";
}

function isDocx(input: ParseInput): boolean {
  const ext = extensionFromName(input.fileName);
  return input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx";
}

function isTxt(input: ParseInput): boolean {
  const ext = extensionFromName(input.fileName);
  return input.mimeType === "text/plain" || ext === "txt";
}

export async function parseDocument(input: ParseInput): Promise<ParsedDocument> {
  if (!input.buffer || input.buffer.length === 0) {
    return { rawText: "", wordCount: 0, pageCount: 0 };
  }

  if (isPdf(input)) {
    const parsed = await pdfParse(input.buffer);
    const rawText = normalizeText(parsed.text ?? "");
    const wordCount = countWords(rawText);
    const pageCount = typeof parsed.numpages === "number" ? parsed.numpages : 1;
    return { rawText, wordCount, pageCount: pageCount || 1 };
  }

  if (isDocx(input)) {
    const result = await mammoth.extractRawText({ buffer: input.buffer });
    const rawText = normalizeText(result.value ?? "");
    const wordCount = countWords(rawText);
    // DOCX doesn't provide page counts via mammoth; return a reasonable default.
    return { rawText, wordCount, pageCount: rawText ? 1 : 0 };
  }

  if (isTxt(input)) {
    const rawText = normalizeText(input.buffer.toString("utf8"));
    const wordCount = countWords(rawText);
    return { rawText, wordCount, pageCount: rawText ? 1 : 0 };
  }

  throw new Error(`Unsupported file type${input.fileName ? `: ${input.fileName}` : ""}`);
}

