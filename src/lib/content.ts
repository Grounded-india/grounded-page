/**
 * Display helpers that clean up the backend's machine phrasing so "thin" / stub
 * stories (a single title-only primary source) don't render as duplicated
 * headlines and boilerplate. These NEVER invent content — they only hide
 * redundancy and reshape what's already in the Markdown.
 */
import type { Story } from "./types";

/** The backend's machine dek prefix, e.g. "Contested: 3 outlet(s), no primary source." */
const CONTESTED_PREFIX_RE =
  /^\s*Contested:\s*\d+\s*outlet\(s\),?\s*no primary source\.?\s*/i;

/** The backend's boilerplate provenance sentence inside a Context section. */
const PROVENANCE_RE =
  /This story is reconstructed from[\s\S]*?no outside information has been added\.?/i;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function firstParagraph(markdown: string): string {
  return markdown.split(/\n{2,}/).map((p) => p.trim()).find(Boolean) ?? "";
}

/**
 * Clean a dek for display: strip the machine "Contested: …" prefix, and drop it
 * entirely when what's left merely echoes the headline (common for wire/official
 * stubs). Returns null when there is nothing worth showing.
 */
export function cleanDek(dek: string | undefined, headline: string): string | null {
  if (!dek) return null;
  const stripped = dek.replace(CONTESTED_PREFIX_RE, "").trim();
  if (!stripped) return null;
  const d = normalize(stripped);
  const h = normalize(headline);
  if (!d || d === h || d.startsWith(h) || h.startsWith(d)) return null;
  return stripped;
}

/**
 * Split a Context section into real editorial body vs the backend's boilerplate
 * provenance note.
 */
export function splitContext(context: string): { body: string; provenance: string | null } {
  const trimmed = context.trim();
  const m = trimmed.match(PROVENANCE_RE);
  if (!m) return { body: trimmed, provenance: null };
  const start = m.index ?? 0;
  const body = (trimmed.slice(0, start) + trimmed.slice(start + m[0].length)).trim();
  return { body, provenance: m[0].trim() };
}

/** True when the story has a real prose body of its own (i.e. not just a stub). */
export function hasContextBody(context: string): boolean {
  return splitContext(context).body.length > 0;
}

/**
 * A one-paragraph preview for hero/teasers. Prefers real context, then a cleaned
 * dek, then the first grounded claim — so a stub still shows a real sentence
 * instead of the "reconstructed from N source item(s)…" boilerplate.
 */
export function storyLede(story: Story): string {
  const { body } = splitContext(story.context);
  if (body) return firstParagraph(body);
  const dek = cleanDek(story.dek, story.headline);
  if (dek) return dek;
  return story.claims[0]?.text ?? "";
}

/**
 * A one-line plain-text blurb for a front-page teaser: the cleaned dek when the
 * backend wrote one, otherwise the opening of the story itself. Emphasis markers
 * and inline outlet refs are flattened, since a teaser renders as plain text
 * rather than through the Markdown renderer.
 */
export function teaserBlurb(story: Story): string {
  const source = cleanDek(story.dek, story.headline) ?? storyLede(story);
  return source
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s*\((?:[a-z0-9]+_)+[a-z0-9]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A clean, human "reconstructed from …" note built from structured data (no raw
 * outlet slugs), used in place of the backend's boilerplate for stub stories.
 */
export function reconstructionNote(story: Story): string {
  const outlets = story.sources;
  if (outlets.length === 0) {
    return "Reconstructed directly from the cited primary source; no outside information was added.";
  }
  const list =
    outlets.length === 1
      ? outlets[0]
      : `${outlets.slice(0, -1).join(", ")} and ${outlets[outlets.length - 1]}`;
  return `Reconstructed directly from ${list}; no outside information was added.`;
}
