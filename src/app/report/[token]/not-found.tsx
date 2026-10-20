import Link from "next/link";

export default function ReportNotFound() {
  return (
    <div className="card mx-auto max-w-xl space-y-3 text-center">
      <h1 className="text-xl font-semibold">Report not available</h1>
      <p className="text-slate-600">
        This link is invalid or the report has expired. Reports are deleted 12 months after the assessment.
      </p>
      <Link href="/assessment" className="btn-primary">
        Start a new assessment
      </Link>
    </div>
  );
}
