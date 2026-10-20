import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { RETENTION_MS } from "./retention";

const COOKIE = "isa_pid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Anonymous participant: a random id in an HttpOnly cookie, no personal data.
 * Creates the participant when the cookie is missing, invalid or purged.
 */
export async function getOrCreateParticipantId(): Promise<string> {
  const jar = await cookies();
  const current = jar.get(COOKIE)?.value;

  let id: string | null = null;
  if (current && UUID.test(current)) {
    const existing = await prisma.participant.findUnique({ where: { id: current }, select: { id: true } });
    id = existing?.id ?? null;
  }
  if (!id) id = (await prisma.participant.create({ data: {} })).id;

  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(RETENTION_MS / 1000),
  });
  return id;
}
