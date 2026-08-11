/**
 * Language codes supported by GROUNDED translated editions.
 * English is always available from the flat legacy file and/or nested `.en.md`.
 */

export const DEFAULT_LANG = "en" as const;

/** Codes the backend may emit under `content/editions/<date>/edition-<date>.<lang>.md`. */
export const SUPPORTED_LANGS = [
  "en",
  "hi",
  "kn",
  "ta",
  "te",
  "bn",
  "mr",
  "ml",
  "gu",
  "pa",
  "ur",
] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number];

export interface LangMeta {
  code: Lang;
  /** BCP 47 tag for `<html lang>`. */
  htmlLang: string;
  /** Endonym shown in the language switcher. */
  label: string;
  /** Latin fallback label for accessibility. */
  englishName: string;
}

export const LANG_META: Record<Lang, LangMeta> = {
  en: { code: "en", htmlLang: "en-IN", label: "English", englishName: "English" },
  hi: { code: "hi", htmlLang: "hi-IN", label: "हिन्दी", englishName: "Hindi" },
  kn: { code: "kn", htmlLang: "kn-IN", label: "ಕನ್ನಡ", englishName: "Kannada" },
  ta: { code: "ta", htmlLang: "ta-IN", label: "தமிழ்", englishName: "Tamil" },
  te: { code: "te", htmlLang: "te-IN", label: "తెలుగు", englishName: "Telugu" },
  bn: { code: "bn", htmlLang: "bn-IN", label: "বাংলা", englishName: "Bengali" },
  mr: { code: "mr", htmlLang: "mr-IN", label: "मराठी", englishName: "Marathi" },
  ml: { code: "ml", htmlLang: "ml-IN", label: "മലയാളം", englishName: "Malayalam" },
  gu: { code: "gu", htmlLang: "gu-IN", label: "ગુજરાતી", englishName: "Gujarati" },
  pa: { code: "pa", htmlLang: "pa-IN", label: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  ur: { code: "ur", htmlLang: "ur-IN", label: "اردو", englishName: "Urdu" },
};

export const LANG_STORAGE_KEY = "grounded.lang";

export function isLang(value: string | null | undefined): value is Lang {
  return Boolean(value && (SUPPORTED_LANGS as readonly string[]).includes(value));
}

export function normalizeLang(value: string | null | undefined): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/** Public path for an edition front page in a given language. */
export function editionPath(date: string, lang: Lang = DEFAULT_LANG): string {
  if (lang === DEFAULT_LANG) return `/edition/${date}/`;
  return `/edition/${date}/${lang}/`;
}

/**
 * Public path for a story in a given language.
 * English stays at the legacy `/story/<date>/<slug>/` URL; translations live
 * under `/l/<lang>/story/<date>/<slug>/` so App Router dynamic segments don't
 * collide (`[slug]` vs `[lang]` cannot be siblings).
 */
export function storyPath(
  date: string,
  slug: string,
  lang: Lang = DEFAULT_LANG,
): string {
  if (lang === DEFAULT_LANG) return `/story/${date}/${slug}/`;
  return `/l/${lang}/story/${date}/${slug}/`;
}
