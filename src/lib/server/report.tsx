import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { AssessmentResult } from "@/lib/assessment/types";
import { ReportDocument } from "@/lib/pdf/ReportDocument";

/** Renders the PDF from the same result object as the online report (FR-024). */
export function renderReportPdf(result: AssessmentResult): Promise<Buffer> {
  return renderToBuffer(<ReportDocument result={result} />);
}

export function pdfFilename(assessedAt: string): string {
  return `it-quick-audit-${assessedAt.slice(0, 10)}.pdf`;
}
