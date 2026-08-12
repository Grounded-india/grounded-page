"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LANG,
  LANG_META,
  LANG_STORAGE_KEY,
  editionPath,
  storyPath,
  type Lang,
} from "@/lib/i18n";
import { t } from "@/lib/ui-i18n";

interface LanguageSwitcherProps {
  date: string;
  lang: Lang;
  availableLangs: Lang[];
  /** When set, switching language deep-links to the same story by index. */
  storyIndex?: number;
  /** Slug map for each available language (index → slug), for story pages. */
  storySlugsByLang?: Partial<Record<Lang, string>>;
  /**
   * Optional explicit targets per language (used on the live English frontpage
   * so chips can jump to the newest translated edition when today has no pack).
   */
  hrefByLang?: Partial<Record<Lang, string>>;
  className?: string;
}

/**
 * Compact language switcher for the masthead utility row. Persists the choice
 * in localStorage and navigates to the matching static edition/story route.
 */
export function LanguageSwitcher({
  date,
  lang,
  availableLangs,
  storyIndex,
  storySlugsByLang,
  hrefByLang,
  className = "",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const langs = useMemo(
    () => availableLangs.filter((code) => Boolean(LANG_META[code])),
    [availableLangs],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* private mode */
    }
  }, [lang]);

  if (langs.length <= 1) return null;

  function hrefFor(next: Lang): string {
    if (hrefByLang?.[next]) return hrefByLang[next]!;
    if (storyIndex !== undefined && storySlugsByLang) {
      const slug = storySlugsByLang[next];
      if (slug) return storyPath(date, slug, next);
    }
    return editionPath(date, next);
  }

  return (
    <div
      className={`lang-switcher ${className}`.trim()}
      role="navigation"
      aria-label={t(lang, "lang.aria")}
    >
      <span className="lang-switcher-label">{t(lang, "lang.label")}</span>
      {langs.map((code) => {
        const meta = LANG_META[code];
        const active = code === lang;
        return (
          <a
            key={code}
            href={hrefFor(code)}
            lang={meta.htmlLang}
            className="lang-switcher-link"
            data-active={active ? "true" : undefined}
            aria-current={active ? "true" : undefined}
            title={meta.englishName}
            onClick={(e) => {
              e.preventDefault();
              try {
                window.localStorage.setItem(LANG_STORAGE_KEY, code);
              } catch {
                /* ignore */
              }
              router.push(hrefFor(code));
            }}
          >
            {code === DEFAULT_LANG ? "EN" : meta.label}
          </a>
        );
      })}
    </div>
  );
}
