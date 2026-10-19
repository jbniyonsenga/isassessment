"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { computeResult } from "@/lib/assessment/scoring";
import { clearAll, getSubmittedSnapshot, subscribeSubmitted } from "@/lib/assessment/storage";
import { EmailReportForm } from "./EmailReportForm";
import { ReportView } from "./ReportView";

export function ReportScreen() {
  // undefined while prerendering on the server, where sessionStorage does not exist.
  const submitted = useSyncExternalStore(subscribeSubmitted, getSubmittedSnapshot, () => undefined);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const result = useMemo(
    () => (submitted ? computeResult(submitted, new Date(submitted.assessedAt)) : null),
    [submitted],
  );

  if (submitted === undefined) return <p className="text-slate-500">Loading report…</p>;

  if (!submitted || !result) {
    return (
      <div className="card space-y-3 text-center">
        <h1 className="text-xl font-semibold">No report available</h1>
        <p className="text-slate-600">
          Reports are kept only in this browser tab and are not stored on our servers. Complete an assessment to
          generate a report.
        </p>
        <Link href="/assessment" className="btn-primary">
          Start an assessment
        </Link>
      </div>
    );
  }

  async function downloadPdf() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch("/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "The PDF could not be generated.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `it-quick-audit-${submitted!.assessedAt.slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "The PDF could not be generated.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Assessment report</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/assessment" className="btn-secondary">
            Modify answers
          </Link>
          <button type="button" className="btn-primary" onClick={downloadPdf} disabled={downloading}>
            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
      </div>
      {downloadError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {downloadError}
        </p>
      )}

      <ReportView result={result} />

      <EmailReportForm submission={submitted} />

      <div className="text-center">
        <button
          type="button"
          className="text-sm text-slate-500 underline hover:text-slate-800"
          onClick={clearAll}
        >
          Clear my answers from this browser
        </button>
      </div>
    </div>
  );
}
