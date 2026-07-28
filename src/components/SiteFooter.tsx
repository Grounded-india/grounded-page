import Link from "next/link";

/** The constant audit note the backend prints at the foot of every edition. */
export const AUDIT_NOTE =
  "Every claim above was extracted from source material, verified against its citations, and audited for hallucination. Items marked DEBATE lack a primary/official source and are presented as contested rather than confirmed.";

const FEEDBACK_FORM_URL = "https://forms.gle/XNjV6qCqHHuBY8Ao7";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-ink/80">
      <div className="mx-auto w-full max-w-broadsheet px-5 py-10 sm:px-8">
        {/* Letters to the Editor — feedback invitation */}
        <aside
          id="correspondence"
          className="letters-box mx-auto max-w-[36rem] scroll-mt-8"
          aria-label="Reader feedback"
        >
          <div className="letters-kicker">
            <span>Correspondence</span>
            <hr className="rule-hair flex-1" />
            <span>Vol. I</span>
          </div>
          <h2 className="letters-headline">Have we kept you grounded?</h2>
          <p className="letters-lede">
            The paper is written by machine; the verdict is yours. Tell us what
            landed, what felt off, and whether the citations earned your trust —
            a minute of frankness beats a thousand polite nods.
          </p>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="letters-cta"
          >
            Write to the editor →
          </a>
          <p className="letters-note">
            Anonymous · takes about a minute · we actually read these
          </p>
        </aside>

        <hr className="rule-thick mx-auto mt-10 w-full max-w-[36rem]" />

        <div className="mt-8 flex flex-col items-center gap-5 text-center">
          <p className="font-masthead text-3xl leading-none text-ink sm:text-4xl">
            The Grounded Times
          </p>
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
