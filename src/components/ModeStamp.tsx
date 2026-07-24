import type { Mode } from "@/lib/types";

/**
 * The mode kicker rendered as a letterpress stamp: DEBATE in a slightly rotated
 * oxblood box, REPORT as a straight ink stamp.
 */
export function ModeStamp({
  mode,
  className = "",
}: {
  mode: Mode;
  className?: string;
}) {
  const isDebate = mode === "debate";
  return (
    <span
      className={`stamp ${isDebate ? "stamp-debate" : "stamp-report"} ${className}`}
      title={
        isDebate
          ? "Contested — no primary or official source; presented as a two-sided debate."
          : "Report — grounded in a primary/official source."
      }
    >
      {isDebate ? "Debate" : "Report"}
    </span>
  );
}
