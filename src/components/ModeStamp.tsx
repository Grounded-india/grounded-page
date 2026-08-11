import type { Mode } from "@/lib/types";
import { DEFAULT_LANG } from "@/lib/i18n";
import { t } from "@/lib/ui-i18n";

/**
 * The mode kicker rendered as a letterpress stamp: DEBATE in a slightly rotated
 * oxblood box, REPORT as a straight ink stamp.
 */
export function ModeStamp({
  mode,
  lang = DEFAULT_LANG,
  className = "",
}: {
  mode: Mode;
  lang?: string;
  className?: string;
}) {
  const isDebate = mode === "debate";
  return (
    <span
      className={`stamp ${isDebate ? "stamp-debate" : "stamp-report"} ${className}`}
      title={t(lang, isDebate ? "mode.debateTitle" : "mode.reportTitle")}
    >
      {t(lang, isDebate ? "mode.debate" : "mode.report")}
    </span>
  );
}
