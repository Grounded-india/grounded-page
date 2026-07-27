import type { Metadata } from "next";
import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { SectionLabel } from "@/components/SectionLabel";
import { ModeStamp } from "@/components/ModeStamp";
import { PrimarySeal } from "@/components/PrimarySeal";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How GROUNDED is made: a six-layer, fully auditable pipeline that grounds every claim in its sources. Report vs. Debate, source tiers, and why every claim is cited.",
};

const PIPELINE: { n: string; title: string }[] = [
  { n: "I", title: "Ingestion" },
  { n: "II", title: "Clustering" },
  { n: "III", title: "Ranking" },
  { n: "IV", title: "Extraction" },
  { n: "V", title: "Verification" },
  { n: "VI", title: "Audit" },
];

export default function AboutPage() {
  return (
    <>
      <Masthead variant="slim" active="about" />

      <div className="mx-auto w-full max-w-[46rem] px-5 pb-8 pt-10 sm:px-8">
        <div className="text-center">
          <span className="kicker text-sepia">A note on method</span>
          <h1
            className="mt-2 font-display font-black leading-[1.02] text-ink"
            style={{ fontSize: "clamp(2.3rem, 6.5vw, 3.8rem)" }}
          >
            Credibility, through transparency
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-display text-xl italic leading-snug text-sepia">
            GROUNDED is written and edited by machine. That is precisely why it
            shows its work.
          </p>
        </div>

        <hr className="rule-double mt-8" />

        <section className="prose-paper mt-8 drop-cap">
          <p>
            A newspaper earns trust slowly and can lose it in a single careless
            line. An autonomous one cannot lean on a masthead of famous by-lines
            or decades of habit. It can offer only one thing in their place: the
            evidence, laid open, for every sentence it prints. Our promise is not
            that we are never wrong. It is that you can always check.
          </p>
          <p>
            To that end nothing here is asserted on the authority of the
            publication alone. Each factual claim is tied to the source it came
            from, and the standing of that source — official record or ordinary
            reporting — is shown to you rather than hidden.
          </p>
        </section>

        <section className="mt-12">
          <SectionLabel>Two tiers of source</SectionLabel>
          <div className="prose-paper">
            <p>
              We hold sources to two distinct offices, and never let them trade
              places.
            </p>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div className="border-t-2 border-ink/70 pt-3">
              <div className="kicker text-ink">Ground truth</div>
              <p className="mt-2 font-body leading-relaxed text-ink">
                Primary and official records and the established wire services —
                the courts, the Reserve Bank, ministries, the agencies. These may
                establish a fact. A claim they confirm carries the seal.
              </p>
            </div>
            <div className="border-t-2 border-ink/30 pt-3">
              <div className="kicker text-sepia">Radar only</div>
              <p className="mt-2 font-body leading-relaxed text-sepia">
                Social posts and aggregators tell us where to point our
                attention. They may raise a subject; they may never, on their
                own, settle a fact. They are a compass, not a witness.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>Report, or Debate</SectionLabel>
          <div className="prose-paper">
            <p>
              Every story is stamped with the ground it stands on. There is no
              third, quieter category for the doubtful.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <div className="flex items-start gap-4 border-t border-ink/15 pt-4">
              <ModeStamp mode="report" className="mt-1 shrink-0" />
              <p className="font-body leading-relaxed text-ink">
                <strong>A Report</strong> rests on at least one primary or
                official source. Its verified claims may carry the gold seal of a
                primary-source backing. This is the paper speaking with the record
                behind it.
              </p>
            </div>
            <div className="flex items-start gap-4 border-t border-ink/15 pt-4">
              <ModeStamp mode="debate" className="mt-1 shrink-0" />
              <p className="font-body leading-relaxed text-ink">
                <strong>A Debate</strong> is a story that matters but which no
                primary or official source has yet confirmed. Rather than bury it
                or dress it up as settled, we set the accounts side by side and
                let the reader see exactly what is — and is not — established.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel>The six layers</SectionLabel>
          <div className="prose-paper mb-6">
            <p>
              From raw record to printed page, every edition passes through six
              stages. Each is designed to be inspected.
            </p>
          </div>
          <ol className="space-y-0">
            {PIPELINE.map((layer) => (
              <li
                key={layer.n}
                className="flex items-baseline gap-5 border-t border-ink/15 py-4 first:border-t-0"
              >
                <span className="w-8 shrink-0 font-display text-2xl font-bold leading-none text-oxblood">
                  {layer.n}
                </span>
                <h3 className="font-display text-xl font-bold text-ink">
                  {layer.title}
                </h3>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <SectionLabel>Every claim, a citation</SectionLabel>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <PrimarySeal size={92} className="shrink-0" />
            <div className="prose-paper">
              <p>
                The seal you will find beside certain claims is not decoration.
                It marks a statement a primary or official source has confirmed.
                Where it is absent, the claim still stands on named reporting —
                you are simply told to weigh it as such. Nothing is left to the
                reader's faith that we got it right.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule-thick mt-12" />
        <p className="mt-6 text-center font-body italic leading-relaxed text-sepia">
          Every claim we print is extracted from source material, verified
          against its citations, and audited for hallucination. That is the whole
          of the method, and the whole of the promise.
        </p>
        <div className="mt-6 text-center">
          <Link href="/" className="nav-link">
            ← Return to the front page
          </Link>
        </div>
      </div>
    </>
  );
}
