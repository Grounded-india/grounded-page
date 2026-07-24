import type { Debate, DebateTurn } from "@/lib/types";
import { Prose } from "./Prose";

/** One speaker's turn in the exchange, marked A/B and coloured by side. */
function Turn({ turn }: { turn: DebateTurn }) {
  const hasBody = turn.body.trim().length > 0;
  const label =
    turn.speaker || (turn.side === 0 ? "One account" : "The other account");
  return (
    <div className="debate-turn" data-side={turn.side}>
      <div className="debate-turn-head">
        <span aria-hidden className="debate-turn-mark">
          {turn.side === 0 ? "A" : "B"}
        </span>
        <span className="debate-speaker">{label}</span>
      </div>
      {hasBody ? (
        <Prose markdown={turn.body} />
      ) : (
        <p className="font-body italic leading-relaxed text-sepia">
          No counter-argument could be constructed from the available sources.
        </p>
      )}
    </div>
  );
}

/**
 * "The debate" as a threaded op-ed exchange: each speaker's turn is stamped A/B
 * and colour-keyed, with side B stepped in to read as a reply. A closing "Bottom
 * line" synthesis (when present) is set apart as a boxed takeaway. This renders
 * both the old two-column Side A/Side B shape and the new multi-turn format.
 */
export function DebateSpread({ debate }: { debate: Debate }) {
  return (
    <div className="debate-thread">
      {debate.turns.map((turn, i) => (
        <Turn key={i} turn={turn} />
      ))}

      {debate.bottomLine && (
        <div className="debate-bottomline">
          <span className="debate-bottomline-label">The bottom line</span>
          <Prose markdown={debate.bottomLine} />
        </div>
      )}
    </div>
  );
}
