import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ANSWER_LABELS, DISCLAIMER, THRESHOLDS, thresholdFor } from "@/lib/assessment/config";
import type { AssessmentResult, Finding, ScoreLevel } from "@/lib/assessment/types";
import { formatDate, formatScore, SEVERITY_LABELS } from "@/lib/assessment/format";

const LEVEL_COLORS: Record<ScoreLevel, string> = {
  strong: "#15803d",
  moderate: "#b45309",
  weak: "#b91c1c",
};

const SEVERITY_COLORS: Record<Finding["severity"], string> = {
  critical: "#b91c1c",
  high: "#c2410c",
  medium: "#b45309",
  low: "#4b5563",
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 6 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 8 },
  muted: { color: "#6b7280" },
  small: { fontSize: 8 },
  row: { flexDirection: "row" },
  box: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 10, marginBottom: 8 },
  alert: { borderWidth: 1, borderColor: "#fca5a5", backgroundColor: "#fef2f2", borderRadius: 4, padding: 10 },
  bold: { fontFamily: "Helvetica-Bold" },
  th: { fontFamily: "Helvetica-Bold", borderBottomWidth: 1, borderColor: "#d1d5db", paddingBottom: 4 },
  td: { borderBottomWidth: 1, borderColor: "#f3f4f6", paddingVertical: 4 },
  barTrack: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginTop: 4 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 7, color: "#9ca3af" },
});

function LevelText({ level }: { level: ScoreLevel | null }) {
  if (!level) return <Text style={s.muted}>No applicable answers</Text>;
  return <Text style={{ color: LEVEL_COLORS[level] }}>{thresholdFor(level).label}</Text>;
}

function FindingItem({ finding }: { finding: Finding }) {
  return (
    <View style={s.box} wrap={false}>
      <Text style={{ color: SEVERITY_COLORS[finding.severity], fontFamily: "Helvetica-Bold", fontSize: 8 }}>
        {SEVERITY_LABELS[finding.severity].toUpperCase()} · {finding.question.id} · Answer:{" "}
        {ANSWER_LABELS[finding.answer]}
      </Text>
      <Text style={[s.bold, { marginTop: 2 }]}>{finding.question.text}</Text>
      <Text style={{ marginTop: 3 }}>
        <Text style={s.bold}>Risk: </Text>
        {finding.question.risk}
      </Text>
      <Text style={{ marginTop: 2 }}>
        <Text style={s.bold}>Recommendation: </Text>
        {finding.question.recommendation}
      </Text>
    </View>
  );
}

export function ReportDocument({ result }: { result: AssessmentResult }) {
  const { context, overall } = result;
  return (
    <Document title="IT System Quick Audit report" author="IT System Quick Audit">
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>IT System Quick Audit — Report</Text>
        <Text style={s.muted}>
          Assessment date: {formatDate(result.assessedAt)} · Questionnaire {result.questionnaireVersion} · Scoring{" "}
          {result.scoringVersion}
        </Text>

        {(context.organization || context.systemName || context.scope) && (
          <View style={[s.box, { marginTop: 12 }]}>
            {context.organization && <Text>Organization: {context.organization}</Text>}
            {context.systemName && <Text>System: {context.systemName}</Text>}
            {context.scope && <Text>Scope: {context.scope}</Text>}
          </View>
        )}

        <Text style={s.h2}>Overall result</Text>
        <View style={s.row}>
          <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", marginRight: 12 }}>
            {formatScore(overall.score)}
          </Text>
          <View style={{ justifyContent: "center" }}>
            <LevelText level={overall.level} />
            <Text style={[s.muted, s.small]}>
              {overall.points} / {overall.maxPoints} applicable points
            </Text>
          </View>
        </View>

        {result.criticalRisks.length > 0 && (
          <View style={[s.alert, { marginTop: 10 }]}>
            <Text style={[s.bold, { color: "#b91c1c" }]}>
              {result.criticalRisks.length} critical risk indicator(s) identified
            </Text>
            <Text>
              Critical indicators are evaluated independently of the overall score and require attention
              regardless of it.
            </Text>
          </View>
        )}

        <Text style={s.h2}>Results by criterion</Text>
        <View style={s.row}>
          <Text style={[s.th, { width: "30%" }]}>Criterion</Text>
          <Text style={[s.th, { width: "15%" }]}>Score</Text>
          <Text style={[s.th, { width: "15%" }]}>Points</Text>
          <Text style={[s.th, { width: "40%" }]}>Level</Text>
        </View>
        {result.criteria.map((c) => (
          <View key={c.criterion.id} style={s.row} wrap={false}>
            <View style={[s.td, { width: "30%" }]}>
              <Text>{c.criterion.name}</Text>
              <View style={s.barTrack}>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    width: `${c.score ?? 0}%`,
                    backgroundColor: c.level ? LEVEL_COLORS[c.level] : "#e5e7eb",
                  }}
                />
              </View>
            </View>
            <Text style={[s.td, { width: "15%" }]}>{formatScore(c.score)}</Text>
            <Text style={[s.td, { width: "15%" }]}>
              {c.points} / {c.maxPoints}
            </Text>
            <View style={[s.td, { width: "40%" }]}>
              <LevelText level={c.level} />
            </View>
          </View>
        ))}

        <Text style={s.h2}>Weaknesses and recommendations</Text>
        {result.findings.length === 0 ? (
          <Text>No negative or partial answers were recorded.</Text>
        ) : (
          result.findings.map((f) => <FindingItem key={f.question.id} finding={f} />)
        )}

        <Text style={s.h2}>Methodology and limitations</Text>
        <Text>
          Each question is answered Yes (2 points), Partially (1 point), No (0 points) or Not applicable (excluded
          from the maximum). Scores are the points obtained divided by the maximum applicable points, multiplied by
          100. Indicative thresholds:{" "}
          {THRESHOLDS.map((t) => `${t.label} from ${t.min}%`).join("; ")}.
        </Text>
        <Text style={{ marginTop: 6 }}>{DISCLAIMER}</Text>

        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `IT System Quick Audit · ${result.questionnaireVersion} / ${result.scoringVersion} · Indicative self-assessment — not a COBIT certification · Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
