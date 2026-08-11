"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  isLang,
  type Lang,
} from "./i18n";

/**
 * Resolve the active UI language for chrome that lives outside an edition
 * (e.g. the site footer in the root layout). Prefers the URL, then
 * `document.documentElement.dataset.lang`, then localStorage.
 */
export function useChromeLang(): Lang {
  const pathname = usePathname() || "/";
  const [lang, setLang] = useState<Lang>(() => langFromPath(pathname));

  useEffect(() => {
    const fromPath = langFromPath(pathname);
    if (fromPath !== DEFAULT_LANG) {
      setLang(fromPath);
      return;
    }
    const fromDom = document.documentElement.dataset.lang;
    if (isLang(fromDom)) {
      setLang(fromDom);
      return;
    }
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(stored)) {
        setLang(stored);
        return;
      }
    } catch {
      /* private mode */
    }
    setLang(DEFAULT_LANG);
  }, [pathname]);

  return lang;
}

function langFromPath(pathname: string): Lang {
  const edition = pathname.match(/^\/edition\/[^/]+\/([a-z]{2})(?:\/|$)/);
  if (edition && isLang(edition[1])) return edition[1];
  const story = pathname.match(/^\/l\/([a-z]{2})\//);
  if (story && isLang(story[1])) return story[1];
  return DEFAULT_LANG;
}
