"use client";

import { useEffect } from "react";
import { LANG_META, type Lang } from "@/lib/i18n";

/** Keep `<html lang>` in sync with the active edition language. */
export function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    const tag = LANG_META[lang]?.htmlLang ?? "en-IN";
    document.documentElement.lang = tag;
    document.documentElement.dataset.lang = lang;
  }, [lang]);
  return null;
}
