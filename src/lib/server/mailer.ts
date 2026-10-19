import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { DISCLAIMER } from "@/lib/assessment/config";

let transporter: Transporter | null | undefined;

/**
 * SMTP transport configured through environment variables. In development without
 * SMTP_HOST, a JSON transport is used so the flow can be tested without sending mail.
 */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (SMTP_HOST) {
    const port = Number(SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
      requireTLS: port !== 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  } else if (process.env.NODE_ENV !== "production") {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporter = null;
  }
  return transporter;
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}

export async function sendReportEmail(to: string, pdf: Buffer, filename: string): Promise<void> {
  const transport = getTransporter();
  if (!transport) throw new Error("Email delivery is not configured");

  await transport.sendMail({
    from: process.env.MAIL_FROM || "IT System Quick Audit <no-reply@localhost>",
    to,
    subject: "Your IT System Quick Audit report",
    text:
      "Hello,\n\n" +
      "Please find attached the report of the IT system quick audit you requested.\n\n" +
      `${DISCLAIMER}\n\n` +
      "Your email address was used only to send this report and has not been stored.\n",
    attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
  });
}
