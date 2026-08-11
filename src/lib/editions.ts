/**
 * Build-time edition loader.
 *
 * Reads `content/editions/*.md` (legacy English) and optional multilingual
 * bundles at `content/editions/<date>/edition-<date>.<lang>.md`. Runs only in
 * Server Components / `generateStaticParams` — the shipped site is a pure
 * static export with no runtime data access.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Edition, EditionMeta, Story } from "./types";
import {
  editionIdFromFilename,
  langEditionFromFilename,
  mergeEditions,
  parseEdition,
} from "./parser";
import { rankStories } from "./importance";
import {
  DEFAULT_LANG,
  isLang,
  normalizeLang,
  type Lang,
  SUPPORTED_LANGS,
} from "./i18n";

const EDITIONS_DIR = path.join(process.cwd(), "content", "editions");

function listDateIds(): string[] {
  if (!fs.existsSync(EDITIONS_DIR)) return [];
  const ids = new Set<string>();

  for (const name of fs.readdirSync(EDITIONS_DIR)) {
    const flat = editionIdFromFilename(name);
    if (flat) {
      ids.add(flat);
      continue;
    }
    const full = path.join(EDITIONS_DIR, name);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
    if (!fs.statSync(full).isDirectory()) continue;
    // A date folder counts even if only nested lang files exist.
    ids.add(name);
  }

  return [...ids].sort().reverse();
}

/** Languages available on disk for a date (always includes `en` when any English source exists). */
export function discoverLangs(date: string): Lang[] {
  const langs = new Set<Lang>();
  const flat = path.join(EDITIONS_DIR, `edition-${date}.md`);
  if (fs.existsSync(flat)) langs.add(DEFAULT_LANG);

  const nestedDir = path.join(EDITIONS_DIR, date);
  if (fs.existsSync(nestedDir) && fs.statSync(nestedDir).isDirectory()) {
    for (const name of fs.readdirSync(nestedDir)) {
      const parsed = langEditionFromFilename(name);
      if (!parsed || parsed.date !== date) continue;
      if (isLang(parsed.lang)) langs.add(parsed.lang);
    }
  }

  // English is the structural base — expose it whenever the date exists at all.
  if (langs.size > 0) langs.add(DEFAULT_LANG);

  return SUPPORTED_LANGS.filter((l) => langs.has(l));
}

function englishSourcePath(date: string): string | null {
  const flat = path.join(EDITIONS_DIR, `edition-${date}.md`);
  if (fs.existsSync(flat)) return flat;
  const nested = path.join(EDITIONS_DIR, date, `edition-${date}.en.md`);
  if (fs.existsSync(nested)) return nested;
  return null;
}

function translatedSourcePath(date: string, lang: Lang): string | null {
  if (lang === DEFAULT_LANG) return englishSourcePath(date);
  const nested = path.join(EDITIONS_DIR, date, `edition-${date}.${lang}.md`);
  return fs.existsSync(nested) ? nested : null;
}

function filterMissingImages(edition: Edition): Edition {
  return {
    ...edition,
    stories: edition.stories.map((story) => ({
      ...story,
      images: story.images.filter(imageExists),
    })),
  };
}

function imageExists(image: { src: string }): boolean {
  if (/^https?:\/\//i.test(image.src) || image.src.startsWith("data:")) {
    return true;
  }
  const rel = image.src.replace(/^\//, "");
  return fs.existsSync(path.join(process.cwd(), "public", rel));
}

/**
 * Load one edition for a date + language.
 * English is parsed for structure; translations overlay display strings by story index.
 */
export function loadEdition(
  date: string,
  lang: Lang = DEFAULT_LANG,
): Edition | undefined {
  const availableLangs = discoverLangs(date);
  if (availableLangs.length === 0) return undefined;

  const resolvedLang = availableLangs.includes(lang) ? lang : DEFAULT_LANG;
  const enPath = englishSourcePath(date);
  if (!enPath) return undefined;

  const english = parseEdition(
    fs.readFileSync(enPath, "utf8"),
    date,
    DEFAULT_LANG,
    availableLangs,
  );

  if (resolvedLang === DEFAULT_LANG) {
    return filterMissingImages(english);
  }

  const trPath = translatedSourcePath(date, resolvedLang);
  if (!trPath) return filterMissingImages(english);

  const translated = parseEdition(
    fs.readFileSync(trPath, "utf8"),
    date,
    resolvedLang,
    availableLangs,
  );
  return filterMissingImages(mergeEditions(english, translated));
}

let editionCache: Map<string, Edition> | null = null;
// Cache only for the production build. In dev we re-read every request so a
// freshly-synced edition appears on refresh without restarting the server.
const CACHE_ENABLED = process.env.NODE_ENV === "production";

function cacheKey(date: string, lang: Lang): string {
  return `${date}::${lang}`;
}

/** Load every English edition, newest-first (archive / sitemap / default home). */
export function getAllEditions(): Edition[] {
  return listDateIds()
    .map((id) => getEdition(id, DEFAULT_LANG))
    .filter((e): e is Edition => Boolean(e));
}

export function getEditionDates(): string[] {
  return listDateIds();
}

export function getEdition(
  date: string,
  lang: string | Lang = DEFAULT_LANG,
): Edition | undefined {
  const resolved = normalizeLang(lang);
  const key = cacheKey(date, resolved);

  if (CACHE_ENABLED) {
    if (!editionCache) editionCache = new Map();
    const hit = editionCache.get(key);
    if (hit) return hit;
  }

  const edition = loadEdition(date, resolved);
  if (CACHE_ENABLED && edition) {
    if (!editionCache) editionCache = new Map();
    editionCache.set(key, edition);
  }
  return edition;
}

export function getLatestEdition(lang: Lang = DEFAULT_LANG): Edition | undefined {
  for (const date of listDateIds()) {
    const edition = getEdition(date, lang);
    if (edition) return edition;
  }
  return undefined;
}

/**
 * Chronological issue number (oldest edition === No. 1). Stable for a given set
 * of editions and grows as newer editions are added.
 */
export function getIssueNumber(date: string): number {
  const chronological = [...listDateIds()].sort((a, b) => a.localeCompare(b));
  const idx = chronological.findIndex((d) => d === date);
  return idx === -1 ? chronological.length : idx + 1;
}

function findStoryIndex(edition: Edition, slug: string): number {
  let needle = slug;
  try {
    needle = decodeURIComponent(slug);
  } catch {
    /* already decoded */
  }
  needle = needle.normalize("NFC");

  const exact = edition.stories.findIndex(
    (s) => s.slug === needle || s.slug.normalize("NFC") === needle,
  );
  if (exact !== -1) return exact;

  // Unicode path round-trips can alter Indic characters; fall back to the
  // leading story index embedded in every slug ("12-…").
  const m = needle.match(/^(\d+)-/);
  if (!m) return -1;
  const index = Number(m[1]);
  return edition.stories.findIndex((s) => s.index === index);
}

export function getStory(
  date: string,
  slug: string,
  lang: string | Lang = DEFAULT_LANG,
): { edition: Edition; story: Story; prev?: Story; next?: Story } | undefined {
  const edition = getEdition(date, lang);
  if (!edition) return undefined;
  const i = findStoryIndex(edition, slug);
  if (i === -1) return undefined;
  return {
    edition,
    story: edition.stories[i],
    prev: edition.stories[i - 1],
    next: edition.stories[i + 1],
  };
}

/** Find the same story (by index) in another language for language switching. */
export function getStoryByIndex(
  date: string,
  index: number,
  lang: Lang,
): Story | undefined {
  return getEdition(date, lang)?.stories.find((s) => s.index === index);
}

/** Lightweight metadata for archive/index listings, newest-first. */
export function getEditionMetas(): EditionMeta[] {
  return getAllEditions().map((edition) => {
    const ranked = rankStories(edition.stories);
    const headlines = ranked.map((r) => r.story.headline);
    return {
      id: edition.id,
      date: edition.date,
      humanDate: edition.humanDate,
      storyCount: edition.stories.length,
      issueNumber: getIssueNumber(edition.id),
      leadHeadline: headlines[0] ?? "—",
      topHeadlines: headlines.slice(0, 3),
      debateCount: edition.stories.filter((s) => s.mode === "debate").length,
      reportCount: edition.stories.filter((s) => s.mode === "report").length,
      primaryCount: edition.stories.filter(
        (s) => s.mode === "report" || s.claims.some((c) => c.primarySourceBacked),
      ).length,
      availableLangs: edition.availableLangs,
    };
  });
}
