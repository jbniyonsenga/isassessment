import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { computeResult } from "@/lib/assessment/scoring";
import type { SubmissionInput } from "@/lib/assessment/schema";
import { ReportDocument } from "@/lib/pdf/ReportDocument";

const MAX_CLIENT_DATE_SKEW_MS = 24 * 60 * 60 * 1000;

/**
 * Keeps the client's submission date so the PDF matches the online report (FR-024),
 * but only if it is plausible; otherwise uses the server time.
 */
function assessmentDate(clientIso: string | undefined): Date {
  const now = Date.now();
  if (clientIso) {
    const t = Date.parse(clientIso);
    if (t <= now + 5 * 60 * 1000 && now - t <= MAX_CLIENT_DATE_SKEW_MS) return new Date(t);
  }
  return new Date(now);
}

/** Scores are always recomputed on the server from the raw answers; the client's figures are never trusted. */
export async function renderReportPdf(input: SubmissionInput): Promise<Buffer> {
  const result = computeResult(
    { answers: input.answers, context: input.context },
    assessmentDate(input.assessedAt),
  );
  return renderToBuffer(<ReportDocument result={result} />);
}

export function pdfFilename(date = new Date()): string {
  return `it-quick-audit-${date.toISOString().slice(0, 10)}.pdf`;
}
