import Link from "next/link";

export function BackLink({ href = "/", label = "Back to home" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-700">
      <span aria-hidden="true">←</span> {label}
    </Link>
  );
}
