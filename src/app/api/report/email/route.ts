import { createHash } from "node:crypto";
import { emailRequestSchema } from "@/lib/assessment/schema";
import { log } from "@/lib/server/logger";
import { isEmailConfigured, sendReportEmail } from "@/lib/server/mailer";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rateLimit";
import { pdfFilename, renderReportPdf } from "@/lib/server/report";
import { parseJson } from "@/lib/server/request";

/**
 * Request ids already handled, so that a double submission sends only one email (FR-036).
 * A failed send is forgotten so the user can retry (FR-035).
 */
const handled = new Map<string, { state: "pending" | "sent"; expiresAt: number }>();
const REQUEST_TTL_MS = 30 * 60 * 1000;

function sweep(now: number) {
  for (const [id, entry] of handled) if (entry.expiresAt <= now) handled.delete(id);
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`email:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = await parseJson(request, emailRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { email, requestId, website, ...submission } = parsed.data;

  // Honeypot filled in: pretend success, send nothing.
  if (website) {
    log.warn("report.email.honeypot");
    return Response.json({ status: "accepted" }, { status: 202 });
  }

  if (!isEmailConfigured()) {
    return Response.json({ error: "Email delivery is currently unavailable." }, { status: 503 });
  }

  // Limit messages per recipient as well, without keeping the address in clear.
  const recipientKey = createHash("sha256").update(email.toLowerCase()).digest("hex");
  const recipientLimit = rateLimit(`email-to:${recipientKey}`, 3, 60 * 60 * 1000);
  if (!recipientLimit.ok) return tooManyRequests(recipientLimit.retryAfter);

  const now = Date.now();
  sweep(now);
  const previous = handled.get(requestId);
  if (previous?.state === "sent") return Response.json({ status: "accepted" }, { status: 202 });
  if (previous?.state === "pending") {
    return Response.json({ error: "This request is already being processed." }, { status: 409 });
  }
  handled.set(requestId, { state: "pending", expiresAt: now + REQUEST_TTL_MS });

  try {
    const pdf = await renderReportPdf(submission);
    await sendReportEmail(email, pdf, pdfFilename());
    handled.set(requestId, { state: "sent", expiresAt: Date.now() + REQUEST_TTL_MS });
    log.info("report.email.sent", { requestId });
    return Response.json({ status: "accepted" }, { status: 202 });
  } catch (error) {
    handled.delete(requestId);
    log.error("report.email.failed", error, { requestId });
    return Response.json(
      { error: "The email could not be sent. Please check the address and try again." },
      { status: 502 },
    );
  }
}
