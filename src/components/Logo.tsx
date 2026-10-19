import { BRAND, LOGO_BARS, LOGO_SHIELD } from "@/lib/assessment/theme";

/** Placeholder logo: a shield holding a rising bar chart. Replace the geometry in theme.ts to rebrand. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d={LOGO_SHIELD} fill={BRAND} />
      {LOGO_BARS.map((b) => (
        <rect key={b.x} x={b.x} y={b.y} width={3} height={b.h} rx={1} fill="#fff" />
      ))}
    </svg>
  );
}
