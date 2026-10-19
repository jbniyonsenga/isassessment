import Link from "next/link";
import { ANSWER_LABELS, DISCLAIMER, THRESHOLDS, thresholdFor } from "@/lib/assessment/config";
import { formatDate, formatScore, SEVERITY_LABELS } from "@/lib/assessment/format";
import { LEVEL_COLOR, LEVEL_ICON, SEVERITY_COLOR } from "@/lib/assessment/theme";
import type { AssessmentResult, CriterionResult, Finding, FindingSeverity, ScoreLevel } from "@/lib/assessment/types";
import { Logo } from "./Logo";

const SEVERITIES: FindingSeverity[] = ["critical", "high", "medium", "low"];
const SEVERITY_ICON: Record<FindingSeverity, string> = { critical: "✕", high: "!", medium: "!", low: "•" };

/** Thresholds sorted ascending, e.g. weak 0–50, moderate 50–80, strong 80–100. */
const BANDS = [...THRESHOLDS]
  .reverse()
  .map((t, i, all) => ({ ...t, max: i < all.length - 1 ? all[i + 1].min : 100 }));

/** Colored status chip that always pairs the color with an icon (never color alone). */
function StatusDot({ color, icon, size = 18 }: { color: string; icon: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.6 }}
    >
      {icon}
    </span>
  );
}

function Level({ level, short = false }: { level: ScoreLevel | null; short?: boolean }) {
  if (!level) return <span className="text-slate-500">{short ? "N/A" : "No applicable answers"}</span>;
  return (
    <span className="inline-flex items-center gap-2 text-slate-800">
      <StatusDot color={LEVEL_COLOR[level]} icon={LEVEL_ICON[level]} />
      {short ? thresholdFor(level).short : thresholdFor(level).label}
    </span>
  );
}

/** Overall score on a 0–100 scale showing the indicative threshold bands. */
function ScoreMeter({ score }: { score: number | null }) {
  return (
    <div className="w-full">
      <div className="relative pt-6">
        {score !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 text-xs font-semibold text-slate-900"
            style={{ left: `${score}%` }}
          >
            ▼
          </div>
        )}
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          {BANDS.map((b) => (
            <div
              key={b.level}
              style={{ width: `${b.max - b.min}%`, backgroundColor: LEVEL_COLOR[b.level], opacity: 0.35 }}
            />
          ))}
        </div>
        {score !== null && (
          <div
            className="absolute top-5 h-5 w-0.5 -translate-x-1/2 rounded bg-slate-900"
            style={{ left: `${score}%` }}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-slate-500">
        {[0, ...BANDS.slice(1).map((b) => b.min), 100].map((v) => (
          <span
            key={v}
            className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
            style={{ left: `${v}%` }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function SeverityTiles({ findings }: { findings: Finding[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SEVERITIES.map((sev) => {
        const count = findings.filter((f) => f.severity === sev).length;
        return (
          <div key={sev} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <StatusDot color={SEVERITY_COLOR[sev]} icon={SEVERITY_ICON[sev]} size={16} />
              {SEVERITY_LABELS[sev]}
            </div>
            <div className={`mt-1 text-3xl font-bold ${count === 0 ? "text-slate-300" : "text-slate-900"}`}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bars, one per criterion, on a shared 0–100 axis with dashed threshold lines. */
function CriteriaChart({ criteria }: { criteria: CriterionResult[] }) {
  const thresholdLines = BANDS.slice(1).map((b) => b.min);
  return (
    <div className="card p-5">
      <div className="space-y-1">
        {criteria.map((c) => (
          <div
            key={c.criterion.id}
            tabIndex={0}
            className="group relative grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 rounded-lg px-2 py-2 outline-none hover:bg-slate-50 focus-visible:bg-slate-50 sm:grid-cols-[9rem_1fr_3.5rem_7rem]"
          >
            <span className="text-sm font-medium text-slate-800">{c.criterion.name}</span>
            <div className="relative h-3 rounded-full bg-slate-100">
              {c.score !== null && c.score > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${c.score}%`, backgroundColor: LEVEL_COLOR[c.level!] }}
                />
              )}
              {thresholdLines.map((t) => (
                <div
                  key={t}
                  className="absolute -inset-y-1 border-l border-dashed border-slate-400"
                  style={{ left: `${t}%` }}
                />
              ))}
            </div>
            <span className="text-right text-sm font-semibold tabular-nums text-slate-900">
              {formatScore(c.score)}
            </span>
            <span className="hidden text-sm sm:block">
              <Level level={c.level} short />
            </span>

            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-36 z-10 mb-1 hidden w-60 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-visible:block"
            >
              <div className="font-semibold">{c.criterion.name}</div>
              <div>
                Score {formatScore(c.score)} · {c.points} / {c.maxPoints} points
              </div>
              <div>
                {c.answered - c.notApplicable} applicable · {c.notApplicable} not applicable
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
        {[...BANDS].reverse().map((b) => (
          <span key={b.level} className="inline-flex items-center gap-1.5">
            <StatusDot color={LEVEL_COLOR[b.level]} icon={LEVEL_ICON[b.level]} size={14} />
            {thresholdFor(b.level).label} ({b.min === 0 ? `below ${b.max}` : `${b.min}+`}%)
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 border-l border-dashed border-slate-400" /> Indicative thresholds
        </span>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const criterion = finding.question.criterion;
  return (
    <li
      className="rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm"
      style={{ borderLeftColor: SEVERITY_COLOR[finding.severity] }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
          <StatusDot color={SEVERITY_COLOR[finding.severity]} icon={SEVERITY_ICON[finding.severity]} size={14} />
          {SEVERITY_LABELS[finding.severity]}
        </span>
        <span className="capitalize text-slate-500">{criterion}</span>
        <span className="text-slate-400">
          {finding.question.id} · Answer: {ANSWER_LABELS[finding.answer]}
        </span>
      </div>
      <p className="mt-2 font-medium text-slate-900">{finding.question.text}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</div>
          <p className="text-slate-700">{finding.question.risk}</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 text-sm">
          <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">Recommendation</div>
          <p className="text-slate-800">{finding.question.recommendation}</p>
        </div>
      </div>
    </li>
  );
}

/** The online report. The PDF (src/lib/pdf/ReportDocument.tsx) renders the same result object (FR-024). */
export function ReportView({ result }: { result: AssessmentResult }) {
  const { overall, context } = result;
  const applicable = result.criteria.reduce((n, c) => n + c.answered - c.notApplicable, 0);
  const notApplicable = result.criteria.reduce((n, c) => n + c.notApplicable, 0);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 text-white">
          <div className="rounded-xl bg-white p-1.5">
            <Logo size={44} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-indigo-200">IT System Quick Audit</p>
            <p className="truncate text-lg font-semibold">
              {[context.organization, context.systemName].filter(Boolean).join(" — ") || "Assessment report"}
            </p>
          </div>
          <div className="w-full text-xs text-indigo-100 sm:w-auto sm:text-right">
            <div>{formatDate(result.assessedAt)}</div>
            <div>
              Questionnaire {result.questionnaireVersion} · Scoring {result.scoringVersion}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall score</div>
            <div className="text-6xl font-bold tabular-nums text-slate-900">{formatScore(overall.score)}</div>
            <div className="mt-1 text-sm">
              <Level level={overall.level} />
            </div>
          </div>
          <div className="space-y-3">
            <ScoreMeter score={overall.score} />
            <p className="text-xs text-slate-500">
              {overall.points} / {overall.maxPoints} applicable points · {applicable} applicable questions ·{" "}
              {notApplicable} not applicable · thresholds are indicative
            </p>
          </div>
        </div>

        {context.scope && (
          <div className="border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Scope: </span>
            <span className="whitespace-pre-line">{context.scope}</span>
          </div>
        )}
      </section>

      {result.criticalRisks.length > 0 && (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-red-900">
            <StatusDot color={SEVERITY_COLOR.critical} icon="!" />
            {result.criticalRisks.length} critical risk indicator(s) identified
          </h2>
          <p className="mt-1 text-sm text-red-900">
            Critical indicators are evaluated independently of the overall score and require attention regardless
            of it.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-red-950">
            {result.criticalRisks.map((f) => (
              <li key={f.question.id} className="flex gap-2">
                <span className="text-red-700">›</span>
                <span>
                  {f.question.risk} <span className="text-red-700">({ANSWER_LABELS[f.answer]})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Results by criterion</h2>
        <CriteriaChart criteria={result.criteria} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Weaknesses and recommendations</h2>
        <SeverityTiles findings={result.findings} />
        {result.findings.length === 0 ? (
          <p className="card mt-4 text-slate-600">No negative or partial answers were recorded.</p>
        ) : (
          <ul className="mt-4 space-y-3">
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
