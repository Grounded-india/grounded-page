import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { DEFAULT_LANG } from "@/lib/i18n";
import { t } from "@/lib/ui-i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

type NavKey = "front" | "archive" | "about" | null;

function MastheadNav({
  active,
  lang,
}: {
  active: NavKey;
  lang: Lang;
}) {
  const items: { href: string; label: string; key: NavKey }[] = [
    { href: "/", label: t(lang, "nav.front"), key: "front" },
    { href: "/archive", label: t(lang, "nav.archive"), key: "archive" },
    { href: "/about", label: t(lang, "nav.method"), key: "about" },
  ];
  return (
    <nav
      aria-label={t(lang, "nav.sections")}
      className="flex items-center justify-center gap-x-7 gap-y-2 py-2.5"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-link"
          data-active={active === item.key ? "true" : undefined}
          aria-current={active === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Slim notice under the nameplate — scrolls to the Letters box in the footer. */
function ReaderNotice({ lang }: { lang: Lang }) {
  return (
    <a href="#correspondence" className="reader-notice group">
      <span className="reader-notice-stamp" aria-hidden="true">
        {t(lang, "notice.stamp")}
      </span>
      <span className="reader-notice-copy">
        <span className="reader-notice-ask">
          {t(lang, "notice.ask")}{" "}
          <span className="reader-notice-jump">{t(lang, "notice.jump")}</span>
        </span>
      </span>
    </a>
  );
}

interface MastheadProps {
  variant?: "full" | "slim";
  humanDate?: string;
  issueNumber?: number;
  active?: NavKey;
  /** Edition date for language switching (omit on archive/about). */
  date?: string;
  lang?: Lang;
  availableLangs?: Lang[];
  storyIndex?: number;
  storySlugsByLang?: Partial<Record<Lang, string>>;
  hrefByLang?: Partial<Record<Lang, string>>;
}

/**
 * The nameplate. `full` is the front-page/edition dressing (utility line,
 * dateline, motto); `slim` is a compact banner for interior pages.
 */
export function Masthead({
  variant = "full",
  humanDate,
  issueNumber,
  active = null,
  date,
  lang = DEFAULT_LANG,
  availableLangs,
  storyIndex,
  storySlugsByLang,
  hrefByLang,
}: MastheadProps) {
  const isFull = variant === "full";
  const switcher =
    date && availableLangs && availableLangs.length > 1 ? (
      <LanguageSwitcher
        date={date}
        lang={lang}
        availableLangs={availableLangs}
        storyIndex={storyIndex}
        storySlugsByLang={storySlugsByLang}
        hrefByLang={hrefByLang}
      />
    ) : null;

  return (
    <header className="mx-auto w-full max-w-broadsheet px-5 pt-6 sm:px-8">
      <hr className="rule-hair" />

      {isFull && (
        <div className="masthead-utility">
          <span className="kicker !text-[0.6rem]">
            Vol. I{issueNumber ? ` · No. ${issueNumber}` : ""}
          </span>
          {switcher ?? <span />}
          <span className="kicker !text-[0.6rem]">{t(lang, "masthead.est")}</span>
        </div>
      )}

      <div className={isFull ? "pt-3 text-center" : "pt-4 text-center"}>
        <Link
          href="/"
          aria-label={t(lang, "masthead.brandAria")}
          className="inline-block"
        >
          <span
            className="block font-body uppercase leading-none text-sepia"
            style={{
              fontSize: isFull ? "0.82rem" : "0.62rem",
              letterSpacing: "0.42em",
              paddingLeft: "0.42em",
              marginBottom: isFull ? "0.15rem" : "0.1rem",
            }}
          >
            The
          </span>
          <span
            className="block font-masthead leading-[0.9] text-ink"
            style={{
              fontSize: isFull
                ? "clamp(2.5rem, 9vw, 5.4rem)"
                : "clamp(1.85rem, 6vw, 2.9rem)",
              letterSpacing: "0.01em",
            }}
          >
            Grounded Times
          </span>
        </Link>
      </div>

      <hr className={isFull ? "rule-double mt-3" : "rule-double mt-2.5"} />

      {isFull ? (
        <>
          <div className="flex flex-col items-center gap-1 pt-3 text-center">
            <p className="kicker text-ink">
              {humanDate ? `${humanDate} · ` : ""}
              {issueNumber ? `No. ${issueNumber} · ` : ""}
              {t(lang, "masthead.factline")}
            </p>
            <p className="font-display text-[1rem] italic text-sepia">
              {t(lang, "masthead.motto")}
            </p>
          </div>
          <hr className="rule-hair mt-3" />
          <MastheadNav active={active} lang={lang} />
          <hr className="rule-thick" />
          <ReaderNotice lang={lang} />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex-1" />
            <MastheadNav active={active} lang={lang} />
            <div className="flex flex-1 justify-end">{switcher}</div>
          </div>
          <hr className="rule-hair" />
          <ReaderNotice lang={lang} />
        </>
      )}
    </header>
  );
}
