import Link from "next/link";

/** The constant audit note the backend prints at the foot of every edition. */
export const AUDIT_NOTE =
  "Every claim above was extracted from source material, verified against its citations, and audited for hallucination. Items marked DEBATE lack a primary/official source and are presented as contested rather than confirmed.";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-ink/80">
      <div className="mx-auto w-full max-w-broadsheet px-5 py-10 sm:px-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="font-masthead text-3xl text-ink">Grounded</p>
          <p className="kicker !tracking-[0.3em]">Every claim, a citation</p>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1"
          >
            <Link href="/" className="nav-link">
              Front Page
            </Link>
            <Link href="/archive" className="nav-link">
              Archive
            </Link>
            <Link href="/about" className="nav-link">
              Method
            </Link>
          </nav>

          <hr className="rule-hair my-2 w-24" />

          <p className="mx-auto max-w-2xl font-body text-[0.82rem] italic leading-relaxed text-sepia">
            {AUDIT_NOTE}
          </p>

          <p className="kicker pt-2 !text-[0.6rem] text-sepia-light">
            An autonomous, fact-grounded news service · Published by machine,
            grounded in sources
          </p>
        </div>
      </div>
    </footer>
  );
}
