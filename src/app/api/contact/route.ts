import { Prisma } from "@/generated/prisma/client";
import { contactSchema } from "@/lib/contact";
import { prisma } from "@/lib/server/db";
import { log } from "@/lib/server/logger";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rateLimit";
import { parseJson } from "@/lib/server/request";
import { schedulePurge } from "@/lib/server/retention";

/** Stores a contact form message. Forwarding by email will be added later (see ContactMessage.notifiedAt). */
export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = await parseJson(request, contactSchema);
  if (!parsed.ok) return parsed.response;
  const { requestId, website, name, organization, topic, message } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  // Honeypot filled in: pretend success, store nothing.
  if (website) {
    log.warn("contact.honeypot");
    return Response.json({ status: "received" }, { status: 201 });
  }

  try {
    await prisma.contactMessage.create({ data: { requestId, name, email, organization, topic, message } });
    log.info("contact.received", { topic });
    schedulePurge();
    return Response.json({ status: "received" }, { status: 201 });
  } catch (error) {
    // Same requestId sent twice (double click): the message is already stored.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ status: "received" }, { status: 200 });
    }
    log.error("contact.failed", error);
    return Response.json({ error: "Your message could not be sent. Please try again." }, { status: 500 });
  }
}
