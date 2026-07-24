/**
 * Build-time edition loader.
 *
 * Reads `content/editions/*.md` from disk via Node fs. This runs only in Server
 * Components and `generateStaticParams` at build time — the shipped site is a
 * pure static export and performs NO runtime data access whatsoever.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Edition, EditionMeta, Story } from "./types";
import { editionIdFromFilename, parseEdition } from "./parser";
import { rankStories } from "./importance";

const EDITIONS_DIR = path.join(process.cwd(), "content", "editions");

/** All edition ids (dates), sorted newest-first. */
function readEditionIds(): string[] {
  if (!fs.existsSync(EDITIONS_DIR)) return [];
  return fs
    .readdirSync(EDITIONS_DIR)
    .map(editionIdFromFilename)
    .filter((id): id is string => id !== null)
    .sort()
    .reverse(); // newest-first
}

let editionCache: Edition[] | null = null;
// Cache only for the production build (the static export is generated once).
// In dev we re-read every request so a freshly-synced edition appears on refresh
// without restarting the server — this is what makes the auto-ingest pipeline
// feel live. See scripts/watch-editions.mjs.
const CACHE_ENABLED = process.env.NODE_ENV === "production";

/** Load and parse every edition, sorted newest-first. Cached per build. */
export function getAllEditions(): Edition[] {
  if (CACHE_ENABLED && editionCache) return editionCache;

  const editions = readEditionIds().map((id) => {
    const file = path.join(EDITIONS_DIR, `edition-${id}.md`);
    return parseEdition(fs.readFileSync(file, "utf8"), id);
  });

  if (CACHE_ENABLED) editionCache = editions;
  return editions;
}

export function getEditionDates(): string[] {
  return getAllEditions().map((e) => e.id);
}

export function getEdition(date: string): Edition | undefined {
  return getAllEditions().find((e) => e.id === date);
}

export function getLatestEdition(): Edition | undefined {
  return getAllEditions()[0];
}

/**
 * Chronological issue number (oldest edition === No. 1). Stable for a given set
 * of editions and grows as newer editions are added.
 */
export function getIssueNumber(date: string): number {
  const chronological = [...getAllEditions()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const idx = chronological.findIndex((e) => e.id === date);
  return idx === -1 ? chronological.length : idx + 1;
}

export function getStory(
  date: string,
  slug: string,
): { edition: Edition; story: Story; prev?: Story; next?: Story } | undefined {
  const edition = getEdition(date);
  if (!edition) return undefined;
  const i = edition.stories.findIndex((s) => s.slug === slug);
  if (i === -1) return undefined;
  return {
    edition,
    story: edition.stories[i],
    prev: edition.stories[i - 1],
    next: edition.stories[i + 1],
  };
}

/** Lightweight metadata for archive/index listings, newest-first. */
export function getEditionMetas(): EditionMeta[] {
  return getAllEditions().map((edition) => {
    // Order the preview headlines by importance so the archive card mirrors the
    // front page rather than raw file order.
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
    };
  });
}
