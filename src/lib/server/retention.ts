import "server-only";
import { prisma } from "./db";
import { log } from "./logger";

/** Assessments, answers, email requests, participants and contact messages are kept 12 months (NFR-003). */
export const RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

export function retentionCutoff(now = Date.now()): Date {
  return new Date(now - RETENTION_MS);
}

export async function purgeExpired(now = Date.now()) {
  const cutoff = retentionCutoff(now);
  // Answers and email requests are removed with their assessment (onDelete: Cascade).
  const assessments = await prisma.assessment.deleteMany({ where: { submittedAt: { lt: cutoff } } });
  const participants = await prisma.participant.deleteMany({
    where: { createdAt: { lt: cutoff }, assessments: { none: {} } },
  });
  const contactMessages = await prisma.contactMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return { assessments: assessments.count, participants: participants.count, contactMessages: contactMessages.count };
}

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
let lastPurge = 0;

/** Runs the purge at most once a day per process, without delaying the caller. */
export function schedulePurge() {
  const now = Date.now();
  if (now - lastPurge < PURGE_INTERVAL_MS) return;
  lastPurge = now;
  purgeExpired(now)
    .then((r) => log.info("retention.purge", r))
    .catch((error) => {
      lastPurge = 0;
      log.error("retention.purge.failed", error);
    });
}
