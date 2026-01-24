import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { Env, SectionSlices } from "../types";
import { normalizeText, slugify } from "../utils";

// Disable worker loading to run in the main thread (Cloudflare Workers constraint)
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

export interface PdfIngestionResult {
  r2Key: string;
  textExcerpt: string;
  sections: SectionSlices;
  fullText: string;
}

export async function ingestPdf(env: Env, pdfUrl: string, opportunityId: string, source: string): Promise<PdfIngestionResult | null> {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    console.warn("pdf fetch failed", response.status, pdfUrl);
    return null;
  }

  const buffer = await response.arrayBuffer();
  const filename = slugify(pdfUrl.split("/").pop() ?? "attachment") || "attachment";
  const r2Key = `${source}/${opportunityId}/${filename}.pdf`;
  await env.PDF_BUCKET.put(r2Key, buffer, {
    httpMetadata: {
      contentType: response.headers.get("content-type") ?? "application/pdf"
    }
  });

  try {
    const text = await extractPdfText(buffer);
    const sections = sliceSections(text);
    const excerpt = buildExcerpt(text, sections);

    return {
      r2Key,
      textExcerpt: excerpt,
      sections,
      fullText: text
    };
  } catch (error) {
    console.error("Failed to extract text from PDF", error);
    // Return result with empty text if extraction fails, so we at least save the file
    return {
      r2Key,
      textExcerpt: "",
      sections: { programDescription: null, requirements: null, evaluationCriteria: null },
      fullText: ""
    };
  }
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true, // Avoid font loading errors
    disableFontFace: true // Avoid font loading errors
  });

  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => (item as TextItem).str);
    fullText += strings.join(" ") + "\n";
  }

  return normalizeText(fullText);
}

function buildExcerpt(text: string, sections: SectionSlices): string {
  const prioritized = [sections.programDescription, sections.requirements, sections.evaluationCriteria]
    .filter(Boolean)
    .join(" ");
  const base = prioritized.length > 0 ? prioritized : text;
  return base.slice(0, 2000);
}

function sliceSections(text: string): SectionSlices {
  const lower = text.toLowerCase();
  const headings = [
    { key: "programDescription", label: "program description" },
    { key: "requirements", label: "requirements" },
    { key: "evaluationCriteria", label: "evaluation criteria" }
  ] as const;

  const positions = headings
    .map((heading) => ({ heading, index: lower.indexOf(heading.label) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index);

  const slices: SectionSlices = {
    programDescription: null,
    requirements: null,
    evaluationCriteria: null
  };

  for (let i = 0; i < positions.length; i += 1) {
    const { heading, index } = positions[i];
    const nextIndex = positions[i + 1]?.index ?? text.length;
    const raw = text.slice(index, nextIndex);
    slices[heading.key] = normalizeText(raw);
  }

  return slices;
}
