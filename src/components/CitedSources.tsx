import { DEFAULT_LANG } from "@/lib/i18n";
import { t } from "@/lib/ui-i18n";

/**
 * Per-story cited outlets, rendered as a restrained small-caps line under a
 * hairline rule. Names arrive already human-readable.
 */
export function CitedSources({
  sources,
  lang = DEFAULT_LANG,
}: {
  sources: string[];
  lang?: string;
}) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-8 border-t border-ink/70 pt-3">
      <span className="kicker text-ink">{t(lang, "section.cited")}</span>
      <p className="mt-1.5 font-body text-sepia">
        {sources.map((s, i) => (
          <span key={`${s}-${i}`}>
            <span className="text-ink">{s}</span>
            {i < sources.length - 1 && (
              <span className="px-2 text-sepia-light">·</span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
