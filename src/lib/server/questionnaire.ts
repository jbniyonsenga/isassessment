import "server-only";
import type { Questionnaire } from "@/lib/assessment/types";
import { prisma } from "./db";

export interface LoadedQuestionnaire {
  /** Database id of the version. */
  versionId: string;
  questionnaire: Questionnaire;
  /** Question code (e.g. "CON-01") → database id, and the reverse. */
  dbIdByCode: Map<string, string>;
  codeByDbId: Map<string, string>;
}

// Published versions are immutable, so they can be cached for the life of the process.
const byId = new Map<string, Promise<LoadedQuestionnaire | null>>();
let activeVersionId: string | null = null;

async function load(where: { id: string } | { isActive: true }): Promise<LoadedQuestionnaire | null> {
  const version = await prisma.questionnaireVersion.findFirst({
    where,
    include: {
      criteria: {
        orderBy: { position: "asc" },
        include: { questions: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!version) return null;

  const dbIdByCode = new Map<string, string>();
  const codeByDbId = new Map<string, string>();
  const questionnaire: Questionnaire = {
    code: version.code,
    criteria: version.criteria.map((c) => ({ id: c.key, name: c.name, description: c.description })),
    questions: version.criteria.flatMap((c) =>
      c.questions.map((q) => {
        dbIdByCode.set(q.code, q.id);
        codeByDbId.set(q.id, q.code);
        return {
          id: q.code,
          criterion: c.key,
          text: q.text,
          risk: q.risk,
          recommendation: q.recommendation,
          critical: q.critical,
        };
      }),
    ),
  };
  return { versionId: version.id, questionnaire, dbIdByCode, codeByDbId };
}

export function getQuestionnaireVersion(versionId: string): Promise<LoadedQuestionnaire | null> {
  let cached = byId.get(versionId);
  if (!cached) {
    cached = load({ id: versionId });
    byId.set(versionId, cached);
    cached.catch(() => byId.delete(versionId));
  }
  return cached;
}

/** The active version is set by the seed at deploy time, before the new process starts. */
export async function getActiveQuestionnaire(): Promise<LoadedQuestionnaire | null> {
  if (activeVersionId) return getQuestionnaireVersion(activeVersionId);
  const loaded = await load({ isActive: true });
  if (loaded) {
    activeVersionId = loaded.versionId;
    byId.set(loaded.versionId, Promise.resolve(loaded));
  }
  return loaded;
}
