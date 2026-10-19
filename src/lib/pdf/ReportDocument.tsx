import { Document, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { ANSWER_LABELS, DISCLAIMER, THRESHOLDS, thresholdFor } from "@/lib/assessment/config";
import type { AssessmentResult, Finding, ScoreLevel } from "@/lib/assessment/types";
import { formatDate, formatScore, SEVERITY_LABELS } from "@/lib/assessment/format";
import { BRAND, LEVEL_COLOR, LOGO_BARS, LOGO_SHIELD, SEVERITY_COLOR } from "@/lib/assessment/theme";

const LEVEL_COLORS = LEVEL_COLOR;
const SEVERITY_COLORS = SEVERITY_COLOR;

/** Thresholds sorted ascending with their upper bound. */
const BANDS = [...THRESHOLDS]
  .reverse()
  .map((t, i, all) => ({ ...t, max: i < all.length - 1 ? all[i + 1].min : 100 }));

function PdfLogo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d={LOGO_SHIELD} fill={BRAND} />
      {LOGO_BARS.map((b) => (
        <Rect key={b.x} x={b.x} y={b.y} width={3} height={b.h} rx={1} fill="#ffffff" />
      ))}
    </Svg>
  );
}

/** A4 width (595pt) minus 2 × 40pt page padding. */
const METER_WIDTH = 515;

function PdfMeter({ score }: { score: number | null }) {
  return (
    <View style={{ width: METER_WIDTH }}>
      <Svg width={METER_WIDTH} height={22}>
        {BANDS.map((b) => (
          <Rect
            key={b.level}
            x={(b.min / 100) * METER_WIDTH + (b.min > 0 ? 1 : 0)}
            y={8}
            width={((b.max - b.min) / 100) * METER_WIDTH - (b.min > 0 ? 1 : 0)}
            height={8}
            fill={LEVEL_COLOR[b.level]}
            fillOpacity={0.35}
          />
        ))}
        {score !== null && (
          <Rect x={(score / 100) * METER_WIDTH - 1} y={3} width={2} height={18} fill="#0f172a" />
        )}
      </Svg>
      <View style={{ position: "relative", height: 10, fontSize: 7, color: "#64748b" }}>
        {[0, ...BANDS.slice(1).map((b) => b.min), 100].map((v) => (
          <Text
            key={v}
            style={{
              position: "absolute",
              left: Math.min(Math.max((v / 100) * METER_WIDTH - 6, 0), METER_WIDTH - 14),
              width: 14,
              textAlign: v === 0 ? "left" : v === 100 ? "right" : "center",
            }}
          >
            {v}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND,
    color: "#ffffff",
    borderRadius: 6,
    padding: 12,
    lineHeight: 1.2,
  },
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: LEVEL_COLORS[level], marginRight: 4 }} />
      <Text>{thresholdFor(level).label}</Text>
    </View>
  );
}

function FindingItem({ finding }: { finding: Finding }) {
  return (
    <View style={[s.box, { borderLeftWidth: 3, borderLeftColor: SEVERITY_COLORS[finding.severity] }]} wrap={false}>
      <Text style={{ color: "#334155", fontFamily: "Helvetica-Bold", fontSize: 8 }}>
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
        <View style={s.header}>
          <View style={{ backgroundColor: "#ffffff", borderRadius: 6, padding: 4, marginRight: 10 }}>
            <PdfLogo size={36} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: "#c7d2fe" }}>IT SYSTEM QUICK AUDIT</Text>
            <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold" }}>Assessment report</Text>
          </View>
          <View style={{ alignItems: "flex-end", fontSize: 8, color: "#e0e7ff" }}>
            <Text>{formatDate(result.assessedAt)}</Text>
            <Text>
              Questionnaire {result.questionnaireVersion} · Scoring {result.scoringVersion}
            </Text>
          </View>
        </View>

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
        <View style={{ marginTop: 6 }}>
          <PdfMeter score={overall.score} />
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
