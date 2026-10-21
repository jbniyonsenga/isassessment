import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { log } from "./logger";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  // Without it, pg silently falls back to localhost:5432 and every query fails with ECONNREFUSED.
  if (!connectionString) log.error("db.config", new Error("DATABASE_URL is not set"));
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
