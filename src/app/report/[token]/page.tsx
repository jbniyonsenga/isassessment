import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmailReportForm } from "@/components/EmailReportForm";
import { ReportActions } from "@/components/ReportActions";
import { ReportView } from "@/components/ReportView";
import { loadReport } from "@/lib/server/assessments";

export const metadata: Metadata = {
  title: "Report — IT System Quick Audit",
  robots: { index: false, follow: false },
};

async function Report({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await loadReport(token);
  if (!report) notFound();

  return (
    <div className="space-y-8">
      <ReportActions token={report.token} />
      <ReportView result={report.result} />
      <EmailReportForm token={report.token} />
      <p className="text-center text-xs text-slate-500">
        This report is available at this private link for 12 months after the assessment, then deleted. Anyone with
        the link can view it. <Link href="/privacy" className="underline">Privacy notice</Link>.
      </p>
    </div>
  );
}

export default function ReportPage({ params }: PageProps<"/report/[token]">) {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading report…</p>}>
      <Report params={params} />
    </Suspense>
  );
}
