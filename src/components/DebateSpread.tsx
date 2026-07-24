import type { Side } from "@/lib/types";
import { Prose } from "./Prose";

function DebateColumn({ side, letter }: { side: Side; letter: "A" | "B" }) {
  const hasBody = side.body.trim().length > 0;
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span
          aria-hidden
          className="font-display text-3xl leading-none text-ink/35"
        >
          {letter}
        </span>
        <span className="section-label !border-b-0 !pb-0">
          {side.label || (letter === "A" ? "One account" : "The other account")}
        </span>
      </div>
      {hasBody ? (
        <Prose markdown={side.body} />
      ) : (
        <p className="font-body italic leading-relaxed text-sepia">
          No counter-argument could be constructed from the available sources.
        </p>
      )}
    </div>
  );
}

/**
 * "The debate" as a two-column op-ed spread with a center rule. Side A left,
 * Side B right; an empty Side B degrades to a tasteful editorial note.
 */
export function DebateSpread({
  debate,
}: {
  debate: { sideA: Side; sideB: Side };
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-0">
      <div className="md:pr-9">
        <DebateColumn side={debate.sideA} letter="A" />
      </div>
      <div className="border-t border-ink/20 pt-8 md:border-l md:border-t-0 md:pl-9 md:pt-0">
        <DebateColumn side={debate.sideB} letter="B" />
      </div>
    </div>
  );
}
