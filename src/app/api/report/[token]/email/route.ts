import { emailRequestSchema } from "@/lib/assessment/schema";
import { Prisma } from "@/generated/prisma/client";
import { loadReport } from "@/lib/server/assessments";
import { prisma } from "@/lib/server/db";
import { log } from "@/lib/server/logger";
import { isEmailConfigured, sendReportEmail } from "@/lib/server/mailer";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rateLimit";
import { pdfFilename, renderReportPdf } from "@/lib/server/report";
import { parseJson } from "@/lib/server/request";

const RECIPIENT_LIMIT_PER_HOUR = 3;

export async function POST(request: Request, ctx: RouteContext<"/api/report/[token]/email">) {
  const limit = rateLimit(`email:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = await parseJson(request, emailRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { requestId, website } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  // Honeypot filled in: pretend success, send nothing.
  if (website) {
    log.warn("report.email.honeypot");
    return Response.json({ status: "accepted" }, { status: 202 });
  }
  if (!isEmailConfigured()) {
    return Response.json({ error: "Email delivery is currently unavailable." }, { status: 503 });
  }

  const { token } = await ctx.params;
  try {
    const report = await loadReport(token);
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    // Duplicate submission (FR-036): never send twice for the same request id.
    const previous = await prisma.emailRequest.findUnique({ where: { requestId } });
    if (previous?.status === "sent") return Response.json({ status: "accepted" }, { status: 202 });
    if (previous?.status === "pending" && Date.now() - previous.createdAt.getTime() < 2 * 60 * 1000) {
      return Response.json({ error: "This request is already being processed." }, { status: 409 });
    }

    if (!previous) {
      const recent = await prisma.emailRequest.count({
        where: { email, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recent >= RECIPIENT_LIMIT_PER_HOUR) return tooManyRequests(3600);
    }

    let emailRequest;
    try {
      emailRequest = previous
        ? await prisma.emailRequest.update({
            where: { id: previous.id },
            data: { status: "pending", attempts: { increment: 1 }, email },
          })
        : await prisma.emailRequest.create({
            data: { requestId, assessmentId: report.assessmentId, email, attempts: 1 },
          });
    } catch (error) {
      // Concurrent duplicate with the same requestId.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return Response.json({ error: "This request is already being processed." }, { status: 409 });
      }
      throw error;
    }

    try {
      const pdf = await renderReportPdf(report.result);
      await sendReportEmail(email, pdf, pdfFilename(report.result.assessedAt));
      await prisma.emailRequest.update({
        where: { id: emailRequest.id },
        data: { status: "sent", sentAt: new Date(), lastError: null },
      });
      log.info("report.email.sent", { requestId });
      return Response.json({ status: "accepted" }, { status: 202 });
    } catch (error) {
      // Failed sends stay retryable with the same request id (FR-035).
      await prisma.emailRequest.update({
        where: { id: emailRequest.id },
        data: { status: "failed", lastError: error instanceof Error ? error.message.slice(0, 500) : "unknown" },
      });
      throw error;
    }
  } catch (error) {
    log.error("report.email.failed", error, { requestId });
    return Response.json(
      { error: "The email could not be sent. Please check the address and try again." },
      { status: 502 },
    );
  }
}
