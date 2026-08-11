"use client";

import Link from "next/link";
import { useChromeLang } from "@/lib/useChromeLang";
import { t } from "@/lib/ui-i18n";

const FEEDBACK_FORM_URL = "https://forms.gle/XNjV6qCqHHuBY8Ao7";

/** English audit note kept for importers / tests that expect the constant. */
export const AUDIT_NOTE =
  "Every claim above was extracted from source material, verified against its citations, and audited for hallucination. Items marked DEBATE lack a primary/official source and are presented as contested rather than confirmed.";

export function SiteFooter() {
  const lang = useChromeLang();

  return (
    <footer className="mt-16 border-t-2 border-ink/80">
      <div className="mx-auto w-full max-w-broadsheet px-5 py-10 sm:px-8">
        <aside
          id="correspondence"
          className="letters-box mx-auto max-w-[36rem] scroll-mt-8"
          aria-label={t(lang, "footer.feedbackAria")}
        >
          <div className="letters-kicker">
            <span>{t(lang, "footer.correspondence")}</span>
            <hr className="rule-hair flex-1" />
            <span>Vol. I</span>
          </div>
          <h2 className="letters-headline">
            {t(lang, "footer.lettersHeadline")}
          </h2>
          <p className="letters-lede">{t(lang, "footer.lettersLede")}</p>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="letters-cta"
          >
            {t(lang, "footer.lettersCta")}
          </a>
          <p className="letters-note">{t(lang, "footer.lettersNote")}</p>
        </aside>

        <hr className="rule-thick mx-auto mt-10 w-full max-w-[36rem]" />

        <div className="mt-8 flex flex-col items-center gap-5 text-center">
          <p className="font-masthead text-3xl leading-none text-ink sm:text-4xl">
            The Grounded Times
          </p>
          <p className="kicker !tracking-[0.3em]">{t(lang, "footer.tagline")}</p>

          <nav
            aria-label={t(lang, "nav.footer")}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1"
          >
            <Link href="/" className="nav-link">
              {t(lang, "nav.front")}
            </Link>
            <Link href="/archive" className="nav-link">
              {t(lang, "nav.archive")}
            </Link>
            <Link href="/about" className="nav-link">
              {t(lang, "nav.method")}
            </Link>
          </nav>

          <hr className="rule-hair my-2 w-24" />

          <p className="mx-auto max-w-2xl font-body text-[0.82rem] italic leading-relaxed text-sepia">
            {t(lang, "footer.audit")}
          </p>

          <p className="kicker pt-2 !text-[0.6rem] text-sepia-light">
            {t(lang, "footer.service")}
          </p>
        </div>
      </div>
    </footer>
  );
}
