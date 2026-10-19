import type { Metadata } from "next";
import { ANSWER_POINTS, DISCLAIMER, SCORING_VERSION, THRESHOLDS } from "@/lib/assessment/config";
import { CRITERIA, QUESTIONNAIRE_VERSION, QUESTIONS } from "@/lib/assessment/questions";

export const metadata: Metadata = { title: "Methodology — IT System Quick Audit" };

export default function MethodologyPage() {
  const criticalCount = QUESTIONS.filter((q) => q.critical).length;
  return (
    <article className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Methodology and limitations</h1>
        <p className="mt-2 text-sm text-slate-500">
          Questionnaire {QUESTIONNAIRE_VERSION} · Scoring {SCORING_VERSION}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Framework</h2>
        <p>
          The questionnaire is structured around the seven information quality criteria associated with COBIT:{" "}
          {CRITERIA.map((c) => c.name.toLowerCase()).join(", ")}. Each criterion is assessed through{" "}
          {QUESTIONS.length / CRITERIA.length} questions on common controls ({QUESTIONS.length} questions in total).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Scoring</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Yes = {ANSWER_POINTS.yes} points, Partially = {ANSWER_POINTS.partial} point, No = {ANSWER_POINTS.no}{" "}
            points.
          </li>
          <li>Not applicable answers are excluded from the maximum applicable score.</li>
          <li>
            Score = points obtained ÷ maximum applicable points × 100, calculated for each criterion and overall.
          </li>
          <li>No score is displayed when no applicable question has been answered.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Indicative thresholds</h2>
        <table className="w-full max-w-md text-sm">
          <tbody className="divide-y divide-slate-200">
            {THRESHOLDS.map((t, i) => (
              <tr key={t.level}>
                <td className="py-2 pr-4 font-medium">{t.label}</td>
                <td className="py-2">
                  {i === 0 ? `${t.min}% and above` : `${t.min}% to below ${THRESHOLDS[i - 1].min}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-slate-600">
          These thresholds are indicative and configurable; they are not a standard.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Risks and critical indicators</h2>
        <p>
          Every No or Partially answer is reported as a weakness with its associated risk and a recommendation.{" "}
          {criticalCount} questions are critical indicators (e.g. backups, access management, segregation of duties).
          A critical indicator answered No is reported as a critical risk, answered Partially as a high risk. Critical
          risks are always displayed, whatever the overall score: a high score never hides them.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Limitations</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Results rely entirely on the answers provided; no evidence is checked.</li>
          <li>All questions carry the same weight within a criterion, and all criteria the same weight overall.</li>
          <li>The questionnaire covers a selection of key controls, not the full COBIT framework.</li>
          <li>The assessment does not replace an audit by a qualified professional.</li>
        </ul>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{DISCLAIMER}</p>
      </section>
    </article>
  );
}
