import { loadReport } from "@/lib/server/assessments";
import { log } from "@/lib/server/logger";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rateLimit";
import { pdfFilename, renderReportPdf } from "@/lib/server/report";

export async function GET(request: Request, ctx: RouteContext<"/api/report/[token]/pdf">) {
  const limit = rateLimit(`pdf:${clientIp(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const { token } = await ctx.params;
  try {
    const report = await loadReport(token);
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    const started = Date.now();
    const pdf = await renderReportPdf(report.result);
    log.info("report.pdf.generated", { ms: Date.now() - started });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename(report.result.assessedAt)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    log.error("report.pdf.failed", error);
    return Response.json({ error: "The PDF could not be generated. Please try again." }, { status: 500 });
  }
}
