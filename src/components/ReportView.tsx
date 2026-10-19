import Link from "next/link";
import { ANSWER_LABELS, DISCLAIMER, thresholdFor } from "@/lib/assessment/config";
import { formatDate, formatScore, SEVERITY_LABELS } from "@/lib/assessment/format";
import type { AssessmentResult, Finding, ScoreLevel } from "@/lib/assessment/types";

const LEVEL_TEXT: Record<ScoreLevel, string> = {
  strong: "text-green-700",
  moderate: "text-amber-700",
  weak: "text-red-700",
};
const LEVEL_BAR: Record<ScoreLevel, string> = {
  strong: "bg-green-600",
  moderate: "bg-amber-500",
  weak: "bg-red-600",
};
const SEVERITY_BADGE: Record<Finding["severity"], string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

function Level({ level }: { level: ScoreLevel | null }) {
  if (!level) return <span className="text-slate-500">No applicable answers</span>;
  return <span className={LEVEL_TEXT[level]}>{thresholdFor(level).label}</span>;
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <li className="card space-y-2 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${SEVERITY_BADGE[finding.severity]}`}>
          {SEVERITY_LABELS[finding.severity]}
        </span>
        <span className="text-slate-500">
          {finding.question.id} · Answer: {ANSWER_LABELS[finding.answer]}
        </span>
      </div>
      <p className="font-medium">{finding.question.text}</p>
      <p className="text-sm text-slate-700">
        <strong>Risk:</strong> {finding.question.risk}
      </p>
      <p className="text-sm text-slate-700">
        <strong>Recommendation:</strong> {finding.question.recommendation}
      </p>
    </li>
  );
}

/** The online report. The PDF (src/lib/pdf/ReportDocument.tsx) renders the same result object (FR-024). */
export function ReportView({ result }: { result: AssessmentResult }) {
  const { overall, context } = result;
  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-500">
        Assessment date: {formatDate(result.assessedAt)} · Questionnaire {result.questionnaireVersion} · Scoring{" "}
        {result.scoringVersion}
      </p>

      {(context.organization || context.systemName || context.scope) && (
        <dl className="card grid gap-2 p-5 text-sm sm:grid-cols-[auto_1fr]">
          {context.organization && (
            <>
              <dt className="font-medium">Organization</dt>
              <dd>{context.organization}</dd>
            </>
          )}
          {context.systemName && (
            <>
              <dt className="font-medium">System</dt>
              <dd>{context.systemName}</dd>
            </>
          )}
          {context.scope && (
            <>
              <dt className="font-medium">Scope</dt>
              <dd className="whitespace-pre-line">{context.scope}</dd>
            </>
          )}
        </dl>
      )}

      <section className="card flex flex-wrap items-center gap-6">
        <div className="text-5xl font-bold">{formatScore(overall.score)}</div>
        <div>
          <p className="text-lg font-semibold">
            <Level level={overall.level} />
          </p>
          <p className="text-sm text-slate-500">
            Overall score · {overall.points} / {overall.maxPoints} applicable points · thresholds are indicative
          </p>
        </div>
      </section>

      {result.criticalRisks.length > 0 && (
        <section role="alert" className="rounded-xl border border-red-300 bg-red-50 p-5">
          <h2 className="font-semibold text-red-800">
            {result.criticalRisks.length} critical risk indicator(s) identified
          </h2>
          <p className="mt-1 text-sm text-red-800">
            Critical indicators are evaluated independently of the overall score and require attention regardless
            of it.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-900">
            {result.criticalRisks.map((f) => (
              <li key={f.question.id}>
                {f.question.risk} <span className="text-red-700">({ANSWER_LABELS[f.answer]})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Results by criterion</h2>
        <div className="card divide-y divide-slate-100 p-0">
          {result.criteria.map((c) => (
            <div key={c.criterion.id} className="grid items-center gap-2 px-5 py-3 sm:grid-cols-[10rem_1fr_4rem_14rem]">
              <span className="font-medium">{c.criterion.name}</span>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full ${c.level ? LEVEL_BAR[c.level] : ""}`}
                  style={{ width: `${c.score ?? 0}%` }}
                />
              </div>
              <span className="font-semibold sm:text-right">{formatScore(c.score)}</span>
              <span className="text-sm">
                <Level level={c.level} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Weaknesses and recommendations</h2>
        {result.findings.length === 0 ? (
          <p className="card text-slate-600">No negative or partial answers were recorded.</p>
        ) : (
          <ul className="space-y-3">
            {result.findings.map((f) => (
              <FindingCard key={f.question.id} finding={f} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {DISCLAIMER}{" "}
        <Link href="/methodology" className="underline">
          Read the methodology and limitations
        </Link>
        .
      </section>
    </div>
  );
}
