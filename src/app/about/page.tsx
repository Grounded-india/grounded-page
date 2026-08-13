import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "fs";
import path from "path";
import { Masthead } from "@/components/Masthead";
import { SectionLabel } from "@/components/SectionLabel";
import { ModeStamp } from "@/components/ModeStamp";
import { PrimarySeal } from "@/components/PrimarySeal";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How The Grounded Times is made: a six-layer, fully auditable pipeline that grounds every claim in its sources. Report vs. Debate, source tiers, and why every claim is cited.",
  alternates: { canonical: "/about/" },
  openGraph: {
    title: "Method · The Grounded Times",
    description:
      "Credibility through transparency — how an autonomous newspaper shows its work.",
    url: "/about/",
  },
};

const PIPELINE: { n: string; title: string; blurb: string }[] = [
  {
    n: "I",
    title: "Ingestion",
    blurb: "Official records, wires, and the day's radar arrive as raw material.",
  },
  {
    n: "II",
    title: "Clustering",
    blurb: "Scattered items that describe the same event are gathered into one story.",
  },
  {
    n: "III",
    title: "Ranking",
    blurb: "Importance is scored by substance and source standing — not virality.",
  },
  {
    n: "IV",
    title: "Extraction",
    blurb: "Claims are pulled out of the source text, one discrete fact at a time.",
  },
  {
    n: "V",
    title: "Verification",
    blurb: "Each claim is checked back against the citation that supposedly supports it.",
  },
  {
    n: "VI",
    title: "Audit",
    blurb: "A final pass hunts for hallucination before anything reaches the page.",
  },
];

function methodImage(filename: string): string | null {
  const rel = path.join("public", "images", "method", filename);
  return existsSync(path.join(process.cwd(), rel))
    ? `/images/method/${filename}`
    : null;
}

export default function AboutPage() {
  const pressImg = methodImage("press.jpg") ?? methodImage("press.webp") ?? methodImage("press.png");
  const recordImg =
    methodImage("record.jpg") ??
    methodImage("record.webp") ??
    methodImage("record.png");

  return (
    <>
      <Masthead variant="slim" active="about" />

      <article className="method-page">
        {/* Opening */}
        <header className="method-hero">
          <span className="kicker text-oxblood">A note on method</span>
          <h1 className="method-title">Credibility, through transparency</h1>
          <p className="method-standfirst">
            GROUNDED is written and edited by machine. That is precisely why it
            shows its work.
          </p>
        </header>

        {pressImg && (
          <figure className="method-bleed">
            <Image
              src={pressImg}
              alt="A letterpress or newspaper printing floor — ink, metal, and paper."
              width={1600}
              height={900}
              className="method-bleed-img"
              priority
            />
            <figcaption className="method-caption">
              The press shows its work. So do we.
            </figcaption>
          </figure>
        )}

        <hr className="rule-double method-rule" />

        {/* Promise */}
        <section className="method-measure prose-paper drop-cap method-enter">
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

        <blockquote className="method-pull">
          <p>You can always check.</p>
        </blockquote>

        {/* Source tiers */}
        <section className="method-section method-enter" style={{ animationDelay: "80ms" }}>
          <div className="method-section-head">
            <SectionLabel>Two tiers of source</SectionLabel>
            <p className="method-lede">
              We hold sources to two distinct offices, and never let them trade
              places.
            </p>
          </div>

          <div className="method-tiers">
            <div className="method-tier" data-tier="ground">
              {recordImg && (
                <div className="method-tier-photo">
                  <Image
                    src={recordImg}
                    alt="Official records and documents that can establish a fact."
                    width={800}
                    height={520}
                    className="method-tier-img"
                  />
                </div>
              )}
              <div className="kicker text-ink">Ground truth</div>
              <h2 className="method-tier-title">The record</h2>
              <p>
                Primary and official sources and the established wire services —
                the courts, the Reserve Bank, ministries, the agencies. These may
                establish a fact. A claim they confirm carries the seal.
              </p>
            </div>
            <div className="method-tier" data-tier="radar">
              <div className="kicker text-sepia">Radar only</div>
              <h2 className="method-tier-title">The compass</h2>
              <p>
                Social posts and aggregators tell us where to point our
                attention. They may raise a subject; they may never, on their
                own, settle a fact. They are a compass, not a witness.
              </p>
            </div>
          </div>
        </section>

        {/* Report / Debate */}
        <section className="method-section method-enter" style={{ animationDelay: "120ms" }}>
          <div className="method-section-head">
            <SectionLabel>Report, or Debate</SectionLabel>
            <p className="method-lede">
              Every story is stamped with the ground it stands on. There is no
              third, quieter category for the doubtful.
            </p>
          </div>

          <div className="method-modes">
            <div className="method-mode">
              <ModeStamp mode="report" />
              <h2 className="method-mode-title">Report</h2>
              <p>
                Rests on at least one primary or official source. Verified
                claims may carry the gold seal. This is the paper speaking with
                the record behind it.
              </p>
            </div>
            <div className="method-mode-rule" aria-hidden="true" />
            <div className="method-mode">
              <ModeStamp mode="debate" />
              <h2 className="method-mode-title">Debate</h2>
              <p>
                A story that matters, but which no primary source has yet
                confirmed. Rather than bury it or dress it up as settled, we set
                the accounts side by side.
              </p>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="method-section method-enter" style={{ animationDelay: "160ms" }}>
          <div className="method-section-head">
            <SectionLabel>The six layers</SectionLabel>
            <p className="method-lede">
              From raw record to printed page, every edition passes through six
              stages. Each is designed to be inspected.
            </p>
          </div>

          <ol className="method-pipeline">
            {PIPELINE.map((layer, i) => (
              <li
                key={layer.n}
                className="method-layer"
                style={{ animationDelay: `${200 + i * 40}ms` }}
              >
                <span className="method-layer-n" aria-hidden="true">
                  {layer.n}
                </span>
                <div>
                  <h3 className="method-layer-title">{layer.title}</h3>
                  <p className="method-layer-blurb">{layer.blurb}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Seal */}
        <section className="method-seal-band method-enter" style={{ animationDelay: "220ms" }}>
          <PrimarySeal size={110} className="method-seal-mark" />
          <div>
            <SectionLabel>Every claim, a citation</SectionLabel>
            <p className="method-seal-copy">
              The seal beside certain claims is not decoration. It marks a
              statement a primary or official source has confirmed. Where it is
              absent, the claim still stands on named reporting — you are simply
              told to weigh it as such. Nothing is left to faith that we got it
              right.
            </p>
          </div>
        </section>

        <hr className="rule-thick method-rule" />

        <footer className="method-close">
          <p>
            Every claim we print is extracted from source material, verified
            against its citations, and audited for hallucination. That is the
            whole of the method, and the whole of the promise.
          </p>
          <Link href="/" className="nav-link">
            ← Return to the front page
          </Link>
        </footer>
      </article>
    </>
  );
}
