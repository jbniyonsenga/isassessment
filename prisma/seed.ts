/**
 * Loads the questionnaire definition from the code into the database.
 * Idempotent: an existing version is never modified (published versions are immutable);
 * a new version code is inserted and becomes the active one.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CURRENT_QUESTIONNAIRE } from "../src/lib/assessment/questions";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const q = CURRENT_QUESTIONNAIRE;
  const existing = await prisma.questionnaireVersion.findUnique({ where: { code: q.code } });

  if (existing) {
    console.log(`Questionnaire ${q.code} already present, not modified.`);
  } else {
    await prisma.questionnaireVersion.create({
      data: {
        code: q.code,
        criteria: {
          create: q.criteria.map((c, i) => ({
            key: c.id,
            name: c.name,
            description: c.description,
            position: i,
            questions: {
              create: q.questions
                .filter((question) => question.criterion === c.id)
                .map((question, j) => ({
                  code: question.id,
                  text: question.text,
                  risk: question.risk,
                  recommendation: question.recommendation,
                  critical: question.critical ?? false,
                  position: j,
                })),
            },
          })),
        },
      },
    });
    console.log(`Questionnaire ${q.code} inserted.`);
  }

  // The code's current version is the active one.
  await prisma.$transaction([
    prisma.questionnaireVersion.updateMany({ where: { code: { not: q.code } }, data: { isActive: false } }),
    prisma.questionnaireVersion.update({ where: { code: q.code }, data: { isActive: true } }),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
