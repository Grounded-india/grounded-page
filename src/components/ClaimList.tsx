import type { Claim } from "@/lib/types";
import { PrimarySeal } from "./PrimarySeal";

/**
 * The verified claims — "Grounded points" (debate) or "What we know" (report).
 * Each claim shows its text, its cited outlets, and, when backed by a primary
 * or official source, a gold seal.
 */
export function ClaimList({ claims }: { claims: Claim[] }) {
  if (!claims || claims.length === 0) return null;
  return (
    <ol className="mt-4 space-y-0">
      {claims.map((claim, i) => (
        <li
          key={i}
          className="flex gap-4 border-t border-ink/15 py-4 first:border-t-0"
        >
          <span
            aria-hidden
            className="mt-1 font-display text-lg leading-none text-sepia-light"
          >
            {String(i + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-body text-[1.02rem] leading-relaxed text-ink">
              {claim.text}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="kicker !text-[0.62rem] text-sepia">
                {claim.outlets.join(" · ")}
              </span>
            </div>
          </div>

          {claim.primarySourceBacked && (
            <div className="flex shrink-0 flex-col items-center gap-1 pl-1 text-center">
              <PrimarySeal size={40} />
              <span className="kicker !text-[0.52rem] !tracking-[0.14em] text-gold-deep">
                Primary
                <br />
                source
              </span>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
