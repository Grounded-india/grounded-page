import { impactLabel, impactPips } from "@/lib/importance";

/**
 * A restrained "signal-strength" meter that visualises a story's importance
 * score (see lib/importance.ts). Five ink bars fill left-to-right; the label
 * spells out the reading. Purely presentational, so it renders on the server.
 */
export function ImpactMeter({
  score,
  showLabel = true,
  className = "",
}: {
  score: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pips = impactPips(score);
  const label = impactLabel(score);

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      title={`Importance: ${label} (${score}/100)`}
      aria-label={`Importance: ${label}`}
    >
      <span className="impact-pips" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <i key={i} data-on={i < pips ? "true" : undefined} />
        ))}
      </span>
      {showLabel && (
        <span className="kicker !text-[0.58rem] !tracking-[0.18em] text-sepia">
          {label}
        </span>
      )}
    </span>
  );
}
