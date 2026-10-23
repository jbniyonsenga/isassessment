import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { DISCLAIMER } from "@/lib/assessment/config";

interface Mail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachment?: { filename: string; content: Buffer };
}

type Sender = (mail: Mail) => Promise<void>;

let sender: Sender | null | undefined;

const from = () => process.env.MAIL_FROM || "IT System Quick Audit <no-reply@localhost>";

/** Resend HTTPS API, for hosts that block outbound SMTP (e.g. Railway Hobby plan). */
function resendSender(apiKey: string): Sender {
  return async (mail) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from(),
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        reply_to: mail.replyTo,
        attachments: mail.attachment
          ? [{ filename: mail.attachment.filename, content: mail.attachment.content.toString("base64") }]
          : undefined,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      // Resend explains the failure (e.g. unverified domain) in `message`.
      const detail = await res.json().then((b: { message?: string }) => b.message, () => undefined);
      throw new Error(`Resend API responded ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }
  };
}

function smtpSender(transport: Transporter): Sender {
  return async (mail) => {
    await transport.sendMail({
      from: from(),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      replyTo: mail.replyTo,
      attachments: mail.attachment ? [{ ...mail.attachment, contentType: "application/pdf" }] : undefined,
    });
  };
}

/**
 * Email provider chosen from environment variables: RESEND_API_KEY, otherwise SMTP_HOST.
 * In development with neither, a JSON transport is used so the flow can be tested without sending mail.
 */
function getSender(): Sender | null {
  if (sender !== undefined) return sender;
  const { RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (RESEND_API_KEY) {
    sender = resendSender(RESEND_API_KEY);
  } else if (SMTP_HOST) {
    const port = Number(SMTP_PORT || 587);
    sender = smtpSender(
      nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
        requireTLS: port !== 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      }),
    );
  } else if (process.env.NODE_ENV !== "production") {
    sender = smtpSender(nodemailer.createTransport({ jsonTransport: true }));
  } else {
    sender = null;
  }
  return sender;
}

export function isEmailConfigured(): boolean {
  return getSender() !== null;
}

export async function sendReportEmail(to: string, pdf: Buffer, filename: string): Promise<void> {
  const send = getSender();
  if (!send) throw new Error("Email delivery is not configured");

  await send({
    to,
    // Replies from users go to a monitored mailbox rather than the no-reply sender.
    replyTo: process.env.MAIL_REPLY_TO?.trim() || undefined,
    subject: "Your IT System Quick Audit report",
    text:
      "Hello,\n\n" +
      "Please find attached the report of the IT system quick audit you requested.\n\n" +
      `${DISCLAIMER}\n\n` +
      "Your email address is used only to deliver this report; the delivery record is deleted after 12 months.\n" +
      "It will never be used for marketing.\n",
    attachment: { filename, content: pdf },
  });
}

export interface ContactNotification {
  name: string;
  email: string;
  organization?: string;
  topicLabel: string;
  message: string;
  receivedAt: Date;
}

/** Address that receives contact form messages; forwarding is skipped when unset. */
export function contactRecipient(): string | null {
  return process.env.CONTACT_TO?.trim() || null;
}

/** Forwards a contact form message to CONTACT_TO, with Reply-To set to the sender. */
export async function sendContactNotification(to: string, msg: ContactNotification): Promise<void> {
  const send = getSender();
  if (!send) throw new Error("Email delivery is not configured");

  await send({
    to,
    replyTo: msg.email,
    subject: `[Contact] ${msg.topicLabel} — ${msg.name}`,
    text:
      `New message from the IT System Quick Audit contact form (${msg.receivedAt.toISOString()}).\n\n` +
      `Name: ${msg.name}\n` +
      `Email: ${msg.email}\n` +
      (msg.organization ? `Organization: ${msg.organization}\n` : "") +
      `Subject: ${msg.topicLabel}\n\n` +
      `${msg.message}\n\n` +
      "Reply to this email to answer the sender directly.\n",
  });
}
