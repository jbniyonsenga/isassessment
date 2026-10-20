import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AssessmentForm } from "@/components/AssessmentForm";
import { getActiveQuestionnaire } from "@/lib/server/questionnaire";

export const metadata: Metadata = { title: "Assessment — IT System Quick Audit" };

async function Questionnaire() {
  // The questionnaire comes from the database: read it at request time, never at build time.
  await connection();
  const loaded = await getActiveQuestionnaire();
  if (!loaded) {
    return <p className="card text-slate-600">The questionnaire is temporarily unavailable. Please try again later.</p>;
  }
  return <AssessmentForm questionnaire={loaded.questionnaire} />;
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading questionnaire…</p>}>
      <Questionnaire />
    </Suspense>
  );
}
