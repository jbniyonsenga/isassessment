import { submissionSchema } from "@/lib/assessment/schema";
import { log } from "@/lib/server/logger";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rateLimit";
import { renderReportPdf, pdfFilename } from "@/lib/server/report";
import { parseJson } from "@/lib/server/request";

/** POST the answers, receive the PDF report. Nothing is stored (NFR-003, NFR-004). */
export async function POST(request: Request) {
  const limit = rateLimit(`pdf:${clientIp(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = await parseJson(request, submissionSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const started = Date.now();
    const pdf = await renderReportPdf(parsed.data);
    log.info("report.pdf.generated", { ms: Date.now() - started });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    log.error("report.pdf.failed", error);
    return Response.json({ error: "The PDF could not be generated. Please try again." }, { status: 500 });
  }
}
