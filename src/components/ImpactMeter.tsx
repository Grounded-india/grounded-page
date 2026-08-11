import { impactLabel, impactPips, type ImpactLabel } from "@/lib/importance";
import { DEFAULT_LANG } from "@/lib/i18n";
import { t, type UiKey } from "@/lib/ui-i18n";

const LABEL_KEY: Record<ImpactLabel, UiKey> = {
  High: "impact.high",
  Notable: "impact.notable",
  Moderate: "impact.moderate",
  Routine: "impact.routine",
};

/**
 * A restrained "signal-strength" meter that visualises a story's importance
 * score (see lib/importance.ts). Five ink bars fill left-to-right; the label
 * spells out the reading. Purely presentational, so it renders on the server.
 */
export function ImpactMeter({
  score,
  lang = DEFAULT_LANG,
  showLabel = true,
  className = "",
}: {
  score: number;
  lang?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const pips = impactPips(score);
  const raw = impactLabel(score);
  const label = t(lang, LABEL_KEY[raw]);

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      title={`${t(lang, "impact.title", { label })} (${score}/100)`}
      aria-label={t(lang, "impact.title", { label })}
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
