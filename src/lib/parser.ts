/**
 * GROUNDED edition parser.
 *
 * A hand-written parser for the fixed Markdown grammar the backend emits. No
 * YAML frontmatter exists, so no gray-matter — we split on `\n---\n` and read
 * each block by its headings. `react-markdown` is used elsewhere ONLY to render
 * the inline Markdown inside prose fields; it never structures the page.
 *
 * Grammar (one `edition-YYYY-MM-DD.md`):
 *
 *   [ header + "In this edition" TOC ]
 *   ---
 *   [ story 1 ]
 *   ---
 *   ...
 *   ---
 *   [ constant footer ]
 */
import type {
  Claim,
  Debate,
  DebateTurn,
  Edition,
  Mode,
  Story,
  StoryBadges,
} from "./types";
import { storySlug } from "./slug";
import { humanizeInlineCitations } from "./humanize";

const WEEKDAYS =
  "(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)";

/**
 * Trailing scrape-attribution suffixes to strip for DISPLAY only. Deliberately
 * small and safe: these are outlet/source tags, never real headline content.
 * The raw headline is retained for anchors/slugs.
 */
const SOURCE_SUFFIXES = [
  "api.sci.gov.in",
  "PRSIndia",
  "PRS India",
  "AP News",
  "AP India",
  "Reuters India",
  "Reuters",
  "The Hindu",
  "Google News India",
  "Google News",
  "Indian Express",
  "PIB",
  "PTI",
  "RBI",
  "NDTV",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SUFFIX_RE = new RegExp(
  `\\s+-\\s+(?:${[...SOURCE_SUFFIXES]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|")})\\s*$`,
);

/** Strip a trailing " - <source>" scrape suffix for display. */
export function stripSourceSuffix(rawHeadline: string): string {
  const stripped = rawHeadline.replace(SUFFIX_RE, "").trim();
  return stripped.length > 0 ? stripped : rawHeadline.trim();
}

function normalize(markdown: string): string {
  return markdown.replace(/\r\n?/g, "\n");
}

/** Split the file into the top-level blocks separated by lines of exactly `---`. */
function splitBlocks(markdown: string): string[] {
  return normalize(markdown).split(/\n[ \t]*-{3,}[ \t]*\n/);
}

const STORY_HEADING_RE = /^##\s+(\d+)\.\s+(.+?)\s*$/m;

function isStoryBlock(block: string): boolean {
  return STORY_HEADING_RE.test(block);
}

/** Fallback human date if the header line can't be read. */
function formatHumanDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface HeaderInfo {
  humanDate: string;
  storyCount: number | null;
}

function parseHeader(headerBlock: string, isoDate: string): HeaderInfo {
  const italicLine = headerBlock
    .split("\n")
    .map((l) => l.trim())
    // Accept both *italic* and _italic_ (backend has emitted both).
    .find((l) => /^(\*[^*].*\*|_[^_].*_)$/.test(l));

  if (!italicLine) {
    return { humanDate: formatHumanDate(isoDate), storyCount: null };
  }

  const inner = italicLine.replace(/^[*_]/, "").replace(/[*_]$/, "");
  const parts = inner.split("·").map((p) => p.trim());

  const dateWeekday = parts.find((p) =>
    new RegExp(`^${WEEKDAYS},`).test(p),
  );
  const dateWithYear = parts.find(
    (p) => /\b\d{4}\b/.test(p) && /[A-Za-z]/.test(p) && !/stor(?:y|ies)/i.test(p),
  );
  const humanDate = dateWeekday || dateWithYear || formatHumanDate(isoDate);

  const countMatch = inner.match(/(\d+)\s+stor(?:y|ies)/i);
  const storyCount = countMatch ? Number(countMatch[1]) : null;

  return { humanDate, storyCount };
}

const BADGE_RE = /^>\s*(.+)$/m;

function parseBadges(badgeBody: string): { mode: Mode; badges: StoryBadges } {
  const tokens = badgeBody
    .split("·")
    .map((t) => t.trim())
    .filter(Boolean);

  const modeToken = (tokens[0] || "").toUpperCase();
  const mode: Mode = modeToken.includes("DEBATE") ? "debate" : "report";

  let sources = 0;
  let claimsKept = 0;
  let verified: number | undefined;

  let impact: number | undefined;

  for (const token of tokens) {
    const s = token.match(/(\d+)\s+sources?/i);
    if (s) sources = Number(s[1]);
    const c = token.match(/(\d+)\s+claim/i);
    if (c) claimsKept = Number(c[1]);
    const v = token.match(/(\d+)\s+verified/i);
    if (v) verified = Number(v[1]);
    // Optional explicit importance score, if the backend adds one later.
    const i = token.match(/(?:impact|priority|score)\s*[:=]?\s*(\d+)/i);
    if (i) impact = Number(i[1]);
  }

  const badges: StoryBadges = { sources, claimsKept };
  if (verified !== undefined) badges.verified = verified;
  if (impact !== undefined) badges.impact = impact;
  return { mode, badges };
}

// Text — *Outlet, Outlet* [ _(primary-source backed)_ ]
// Also accepts _Outlet_ (underscore italics) — newer backend editions use that.
// Separator is an em/en dash; non-greedy text so an embedded dash in the claim
// (e.g. "NEW YORK (AP) — U.S.") is kept and only the final "— *outlet*" splits.
const CLAIM_RE =
  /^-\s+(.*?)\s+[—–]\s+(?:\*|_)([^*_]+)(?:\*|_)\s*(?:_\(primary-source backed\)_)?\s*$/;

export function parseClaimLine(line: string): Claim | null {
  const match = line.match(CLAIM_RE);
  if (!match) return null;
  return {
    text: match[1].trim(),
    outlets: match[2]
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    primarySourceBacked: /_\(primary-source backed\)_\s*$/.test(line),
  };
}

function parseClaims(section: string | undefined): Claim[] {
  if (!section) return [];
  const claims: Claim[] = [];
  for (const line of section.split("\n")) {
    const claim = parseClaimLine(line.trim());
    if (claim) claims.push(claim);
  }
  return claims;
}

/**
 * A bold header at the START of a line, capturing the label. Matches both:
 *   (old) "**Side A — Supporters' account**"  — body on the following lines
 *   (new) "**J&K CM Omar Abdullah:**"          — body on the SAME line
 * The trailing `:?[ \t]*` swallows an outside colon and the gap before an
 * inline body; an inside colon (new format) is captured and stripped below.
 */
const TURN_HEADER_RE = /^\*\*\s*(.+?)\s*\*\*\s*:?[ \t]*/gm;
const SIDE_HEADER_RE = /^Side\s+([AB])\b\s*(?:[—–-]\s*)?(.*)$/i;
const TURN_MARKER_RE = /\s*\((?:rebuttal|closing|opening|response)\)\s*$/i;

/**
 * Parse "### The debate" into an ordered list of {speaker, body, side} turns,
 * plus an optional "Bottom line" synthesis. Speakers are mapped to two sides in
 * order of first appearance so rebuttals/closings line up with their opener.
 */
function parseDebate(section: string | undefined): Debate | undefined {
  if (!section) return undefined;

  const heads = [...section.matchAll(TURN_HEADER_RE)];
  if (heads.length === 0) return undefined;

  const turns: DebateTurn[] = [];
  const sideByParty = new Map<string, number>();
  let bottomLine: string | undefined;

  for (let i = 0; i < heads.length; i++) {
    const head = heads[i];
    const header = head[1].trim().replace(/:$/, "").trim();
    const bodyStart = (head.index ?? 0) + head[0].length;
    const bodyEnd =
      i + 1 < heads.length ? (heads[i + 1].index ?? section.length) : section.length;
    const body = humanizeInlineCitations(section.slice(bodyStart, bodyEnd).trim());

    if (/^bottom\s+line\b/i.test(header)) {
      bottomLine = body;
      continue;
    }

    const sideMatch = header.match(SIDE_HEADER_RE);
    let speaker: string;
    let side: number;
    if (sideMatch) {
      side = sideMatch[1].toUpperCase() === "A" ? 0 : 1;
      speaker = sideMatch[2].trim();
    } else {
      const party = header.replace(TURN_MARKER_RE, "").trim();
      if (!sideByParty.has(party)) sideByParty.set(party, sideByParty.size % 2);
      side = sideByParty.get(party) ?? 0;
      speaker = header;
    }
    turns.push({ speaker, body, side });
  }

  if (turns.length === 0) return undefined;
  const debate: Debate = { turns };
  if (bottomLine !== undefined) debate.bottomLine = bottomLine;
  return debate;
}

const SECTION_HEADING_RE = /^###\s+(.+?)\s*$/;

/** Bucket a story block's lines by their `### Section` headings. */
function splitSections(block: string): Map<string, string> {
  const sections = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of block.split("\n")) {
    const heading = line.match(SECTION_HEADING_RE);
    if (heading) {
      current = heading[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)!.push(line);
  }

  const out = new Map<string, string>();
  for (const [name, lines] of sections) {
    out.set(name, lines.join("\n").trim());
  }
  return out;
}

const SOURCES_RE = /^\*\*Sources:\*\*\s+(.+)$/m;

/**
 * A `### Report` (or `### What we know`) section is the last one in a story
 * block, so it absorbs the trailing "**Sources:**" line and any "*Public
 * discussion…*" signal note. Cut those off so only the prose body remains.
 */
function stripTrailingMeta(text: string): string {
  const idx = text.search(/^\*\*Sources:\*\*/m);
  return (idx === -1 ? text : text.slice(0, idx)).trim();
}

function parseSources(block: string): string[] {
  const match = block.match(SOURCES_RE);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Find the optional dek: the first single-italic line between heading and badge. */
function parseDek(block: string): string | undefined {
  const lines = block.split("\n");
  const headingIdx = lines.findIndex((l) => STORY_HEADING_RE.test(l));
  const badgeIdx = lines.findIndex((l) => /^>\s*/.test(l));
  const end = badgeIdx === -1 ? lines.length : badgeIdx;

  for (let i = headingIdx + 1; i < end; i++) {
    const line = lines[i].trim();
    // Backend has emitted both *dek* and _dek_.
    const star = line.match(/^\*([^*].*?)\*$/);
    if (star) return star[1].trim();
    const under = line.match(/^_([^_].*?)_$/);
    if (under) return under[1].trim();
  }
  return undefined;
}

function parseStory(block: string): Story | null {
  const heading = block.match(STORY_HEADING_RE);
  if (!heading) return null;

  const index = Number(heading[1]);
  const rawHeadline = heading[2].trim();

  const badgeMatch = block.match(BADGE_RE);
  const { mode, badges } = parseBadges(badgeMatch ? badgeMatch[1] : "");

  const sections = splitSections(block);
  const context = sections.get("Context") ?? "";

  const debate = mode === "debate" ? parseDebate(sections.get("The debate")) : undefined;
  const claims = parseClaims(
    mode === "debate" ? sections.get("Grounded points") : sections.get("What we know"),
  );

  // Newer report editions carry a full "### Report" narrative; older stub
  // reports don't and lean on `claims` instead.
  const reportBody = stripTrailingMeta(sections.get("Report") ?? "");
  const report = reportBody ? humanizeInlineCitations(reportBody) : undefined;

  const story: Story = {
    index,
    slug: storySlug(index, rawHeadline),
    headline: stripSourceSuffix(rawHeadline),
    rawHeadline,
    mode,
    dek: parseDek(block),
    badges,
    context,
    claims,
    sources: parseSources(block),
  };

  if (report) story.report = report;
  if (debate) story.debate = debate;
  return story;
}

/**
 * Parse a full edition file.
 * @param markdown Raw file contents.
 * @param id The edition id === date "YYYY-MM-DD" (from the filename).
 */
export function parseEdition(markdown: string, id: string): Edition {
  const blocks = splitBlocks(markdown);

  const headerBlock = blocks[0] ?? "";
  const { humanDate, storyCount } = parseHeader(headerBlock, id);

  const stories = blocks
    .filter(isStoryBlock)
    .map(parseStory)
    .filter((s): s is Story => s !== null)
    .sort((a, b) => a.index - b.index);

  return {
    id,
    date: id,
    humanDate,
    storyCount: storyCount ?? stories.length,
    stories,
  };
}

/** Derive the edition id (date) from an `edition-YYYY-MM-DD.md` filename. */
export function editionIdFromFilename(filename: string): string | null {
  const match = filename.match(/^edition-(\d{4}-\d{2}-\d{2})\.md$/);
  return match ? match[1] : null;
}
