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
  Lang,
  Mode,
  Story,
  StoryBadges,
  StoryImage,
} from "./types";
import { DEFAULT_LANG } from "./i18n";
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
    (p) =>
      /\b\d{4}\b/.test(p) &&
      !/^\d+\s+\S+$/.test(p) &&
      !/stor(?:y|ies)/i.test(p),
  );
  const humanDate = dateWeekday || dateWithYear || formatHumanDate(isoDate);

  // English "25 stories", or translated chrome ("25 स्टोरीज़", …).
  const countMatch =
    inner.match(/(\d+)\s+stor(?:y|ies)/i) ||
    inner.match(/(\d+)\s+\S+\s*$/);
  const storyCount = countMatch ? Number(countMatch[1]) : null;

  return { humanDate, storyCount };
}

const BADGE_RE = /^>\s*(.+)$/m;

/** Tokens that mark debate mode in English or common Indic translations. */
const DEBATE_MODE_RE =
  /debate|डिबेट|बहस|चर्चा|वाद|ಚರ್ಚೆ|చర్చ|డిబేట్|விவாதம்|বিতর্ক|ચર્ચા|ਚਰਚਾ|مناظرہ/i;

function parseBadges(badgeBody: string): { mode: Mode; badges: StoryBadges } {
  const tokens = badgeBody
    .split("·")
    .map((t) => t.trim())
    .filter(Boolean);

  const modeToken = tokens[0] || "";
  const mode: Mode = DEBATE_MODE_RE.test(modeToken) ? "debate" : "report";

  let sources = 0;
  let claimsKept = 0;
  let verified: number | undefined;

  let impact: number | undefined;

  for (const token of tokens) {
    const s = token.match(/(\d+)\s+(?:sources?|सोर्स|स्रोत|स्त्रोत|ಮೂಲ|మూల)/i);
    if (s) sources = Number(s[1]);
    const c = token.match(
      /(\d+)\s+(?:claim|दाव|दावे|ಹೇಳಿಕೆ|వాదన)/i,
    );
    if (c) claimsKept = Number(c[1]);
    const v = token.match(/(\d+)\s+(?:verified|सत्यापित|ಪರಿಶೀಲಿತ)/i);
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

    if (
      /^bottom\s+line\b/i.test(header) ||
      /^(?:निष्कर्ष|తుది\s*గమనిక|బాటమ్\s*లైన్|ಮುಗింపು|एकूण|सारांश)\b/i.test(
        header,
      )
    ) {
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

/**
 * Canonical section keys the rest of the parser looks up. Translated editions
 * rename these headings; map every known alias back to English keys so one
 * parse path works for en/hi/kn/mr/te (and leftovers fall through as-is).
 */
function canonicalizeSection(name: string): string {
  // Strip parenthetical English leftovers: "पार्श्वभूमी (Context)"
  const bare = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .trim();

  if (
    bare === "context" ||
    bare === "संदर्भ" ||
    bare === "पृष्ठभूमि" ||
    bare === "पार्श्वभूमी" ||
    bare === "ಹಿನ್ನೆಲೆ" ||
    bare === "ಸಂದರ್ಭ" ||
    bare === "నేపథ్యం" ||
    bare === "నేపధ్యం" ||
    bare === "కాంటెక్స్ట్"
  ) {
    return "Context";
  }
  if (
    bare === "the debate" ||
    bare === "debate" ||
    bare === "बहस" ||
    bare === "डिबेट" ||
    bare === "चर्चा" ||
    bare === "वाद" ||
    bare === "ಚರ್ಚೆ" ||
    bare === "చర్చ" ||
    bare === "డిబేట్"
  ) {
    return "The debate";
  }
  if (
    bare === "grounded points" ||
    bare.includes("ग्राउंड") ||
    bare.includes("जमीनी") ||
    bare.includes("पुख्ता") ||
    bare.includes("सत्यावर") ||
    bare.includes("ಗ್ರೌಂಡ") ||
    bare.includes("ಆಧಾರಿತ") ||
    bare.includes("గ్రౌండ") ||
    bare.includes("ఆధారాల")
  ) {
    return "Grounded points";
  }
  if (bare === "what we know") return "What we know";
  if (
    bare === "report" ||
    bare === "रिपोर्ट" ||
    bare === "अहवाल" ||
    bare === "वृत्त" ||
    bare === "ವರದಿ" ||
    bare === "రిపోర్ట్" ||
    bare === "నివేదిక"
  ) {
    return "Report";
  }
  return name.trim();
}

/** Bucket a story block's lines by their `### Section` headings. */
function splitSections(block: string): Map<string, string> {
  const sections = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of block.split("\n")) {
    const heading = line.match(SECTION_HEADING_RE);
    if (heading) {
      current = canonicalizeSection(heading[1]);
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)!.push(line);
  }

  const out = new Map<string, string>();
  for (const [name, lines] of sections) {
    // If both Report and What we know appear, keep both; parseStory prefers Report.
    out.set(name, lines.join("\n").trim());
  }
  return out;
}

const SOURCES_RE =
  /^\*\*(?:Sources|स्रोत|सोर्स|स्त्रोत|ಮೂಲಗಳು|మూలాలు|సోర్సెస్):\*\*\s+(.+)$/m;

/**
 * Resolve a Markdown image path to a site-root public URL.
 *
 * Nested multilingual files use `../../images/<date>/….jpg`; flat English files
 * use `images/<date>/….jpg`. Both must become `/images/<date>/….jpg`.
 */
export function resolveImageSrc(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Drop leading ./ ../ segments and a leading slash, then re-root.
  const cleaned = trimmed
    .replace(/^(?:\.\.\/|\.\/)+/, "")
    .replace(/^\//, "");

  if (cleaned.startsWith("images/")) return `/${cleaned}`;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${cleaned}`;
}

const IMAGE_BLOCK_RE =
  /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)(?:\s*\n+[ \t]*<sub>\s*\*([\s\S]*?)\*\s*<\/sub>)?/g;

/**
 * Photo credit trails. English "Photo via …" plus Hindi/Marathi credit phrases
 * and a few word-order variants the translator emits.
 */
const PHOTO_VIA_RE =
  /(?:—|–|-)\s*(?:Photo via|फोटो साभार:?|फोटो सौजन्य:?|ಫೋಟೋ ಸೌಜನ್ಯ:?|ఫోటో సౌజన్యం:?)\s*(?:\[([^\]]+)\]\(([^)]+)\)|([^.*]+))\s*$/i;

const PHOTO_VIA_ALT_RE =
  /(?:—|–|-)\s*(?:फोटो\s*(?:\[([^\]]+)\]\(([^)]+)\)|([^.*]+))\s*के सौजन्य से|(?:\[([^\]]+)\]\(([^)]+)\)|([^.*]+))\s*के सौजन्य से फोटो|फोटो:\s*(?:\[([^\]]+)\]\(([^)]+)\)|([^.*]+))\s*के सौजन्य से)\s*$/i;

/** Pull every photograph (and optional caption/credit) out of a story block. */
export function parseStoryImages(block: string): StoryImage[] {
  const images: StoryImage[] = [];
  for (const match of block.matchAll(IMAGE_BLOCK_RE)) {
    const alt = (match[1] || "").trim();
    const src = resolveImageSrc(match[2] || "");
    if (!src) continue;

    let caption: string | undefined;
    let credit: string | undefined;
    let creditUrl: string | undefined;

    const rawCaption = (match[3] || "").trim();
    if (rawCaption) {
      const via = rawCaption.match(PHOTO_VIA_RE) || rawCaption.match(PHOTO_VIA_ALT_RE);
      if (via) {
        credit =
          (via[1] || via[3] || via[4] || via[6] || via[7] || via[9] || "").trim() ||
          undefined;
        creditUrl = (via[2] || via[5] || via[8] || "").trim() || undefined;
        caption =
          rawCaption
            .replace(PHOTO_VIA_RE, "")
            .replace(PHOTO_VIA_ALT_RE, "")
            .trim() || undefined;
      } else {
        caption = rawCaption;
      }
    }

    const image: StoryImage = { src, alt: alt || caption || "Photograph" };
    if (caption) image.caption = caption;
    if (credit) image.credit = credit;
    if (creditUrl) image.creditUrl = creditUrl;
    images.push(image);
  }
  return images;
}

/** Remove image Markdown (and following `<sub>` captions) so prose stays clean. */
export function stripImages(markdown: string): string {
  return markdown
    .replace(IMAGE_BLOCK_RE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * A `### Report` (or `### What we know`) section is the last one in a story
 * block, so it absorbs the trailing "**Sources:**" line and any "*Public
 * discussion…*" signal note. Cut those off so only the prose body remains.
 */
function stripTrailingMeta(text: string): string {
  const idx = text.search(
    /^\*\*(?:Sources|स्रोत|सोर्स|स्त्रोत|ಮೂಲಗಳು|మూలాలు|సోర్సెస్):\*\*/m,
  );
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

  const images = parseStoryImages(block);
  const sections = splitSections(block);
  const context = stripImages(sections.get("Context") ?? "");

  const debate =
    mode === "debate"
      ? parseDebate(stripImages(sections.get("The debate") ?? ""))
      : undefined;
  const claims = parseClaims(
    mode === "debate"
      ? sections.get("Grounded points")
      : sections.get("What we know"),
  );

  // Newer report editions carry a full "### Report" narrative; older stub
  // reports don't and lean on `claims` instead.
  const reportBody = stripImages(stripTrailingMeta(sections.get("Report") ?? ""));
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
    images,
  };

  if (report) story.report = report;
  if (debate) story.debate = debate;
  return story;
}

/**
 * Parse a full edition file.
 * @param markdown Raw file contents.
 * @param id The edition id === date "YYYY-MM-DD" (from the filename).
 * @param lang Language code for this file (default `en`).
 */
export function parseEdition(
  markdown: string,
  id: string,
  lang: Lang = DEFAULT_LANG,
  availableLangs: Lang[] = [DEFAULT_LANG],
): Edition {
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
    lang,
    availableLangs,
  };
}

function pickText(preferred: string | undefined, fallback: string | undefined): string | undefined {
  const p = preferred?.trim();
  if (p) return preferred;
  const f = fallback?.trim();
  if (f) return fallback;
  return undefined;
}

function mergeImages(en: StoryImage[], tr: StoryImage[]): StoryImage[] {
  if (en.length === 0) return tr;
  if (tr.length === 0) return en;
  const n = Math.max(en.length, tr.length);
  const out: StoryImage[] = [];
  for (let i = 0; i < n; i++) {
    const a = en[i];
    const b = tr[i];
    if (!a) {
      out.push(b);
      continue;
    }
    if (!b) {
      out.push(a);
      continue;
    }
    out.push({
      // Prefer English/resolved src (same asset); keep translated caption/credit.
      src: a.src || b.src,
      alt: pickText(b.alt, a.alt) || a.alt,
      caption: pickText(b.caption, a.caption),
      credit: pickText(b.credit, a.credit),
      creditUrl: b.creditUrl || a.creditUrl,
    });
  }
  return out;
}

function mergeDebate(en?: Debate, tr?: Debate): Debate | undefined {
  if (!tr && !en) return undefined;
  if (!tr) return en;
  if (!en) return tr;

  const turns = en.turns.map((turn, i) => {
    const t = tr.turns[i];
    if (!t) return turn;
    return {
      speaker: pickText(t.speaker, turn.speaker) || turn.speaker,
      body: pickText(t.body, turn.body) || turn.body,
      side: turn.side,
    };
  });
  // Append any extra translated turns the English parse missed.
  for (let i = en.turns.length; i < tr.turns.length; i++) {
    turns.push(tr.turns[i]);
  }

  const debate: Debate = { turns };
  const bottom = pickText(tr.bottomLine, en.bottomLine);
  if (bottom !== undefined) debate.bottomLine = bottom;
  return debate;
}

function mergeStory(en: Story, tr: Story | undefined): Story {
  if (!tr) return en;

  const headline = pickText(tr.headline, en.headline) || en.headline;
  const rawHeadline = pickText(tr.rawHeadline, en.rawHeadline) || en.rawHeadline;

  const merged: Story = {
    // Structural fields prefer English (mode, badges, source URLs, claim count).
    index: en.index,
    mode: en.mode,
    badges: en.badges.sources > 0 || en.badges.claimsKept > 0 ? en.badges : tr.badges,
    sources: en.sources.length > 0 ? en.sources : tr.sources,
    claims: en.claims.length > 0 ? en.claims : tr.claims,
    // Keep the English slug for stable static routes (Unicode path segments
    // break Next's static export lookup). Display strings stay translated.
    slug: en.slug,
    headline,
    rawHeadline,
    dek: pickText(tr.dek, en.dek),
    context: pickText(tr.context, en.context) || "",
    images: mergeImages(en.images, tr.images),
  };

  const report = pickText(tr.report, en.report);
  if (report !== undefined) merged.report = report;

  const debate = mergeDebate(en.debate, tr.debate);
  if (debate) merged.debate = debate;

  return merged;
}

/**
 * Merge a translated edition onto the English structural parse.
 * Stories are joined by `## N.` index; missing translated fields fall back to English.
 */
export function mergeEditions(english: Edition, translated: Edition): Edition {
  const byIndex = new Map(translated.stories.map((s) => [s.index, s]));
  return {
    ...english,
    humanDate: pickText(translated.humanDate, english.humanDate) || english.humanDate,
    storyCount: Math.max(english.storyCount, translated.storyCount),
    stories: english.stories.map((s) => mergeStory(s, byIndex.get(s.index))),
    lang: translated.lang,
    availableLangs: translated.availableLangs.length
      ? translated.availableLangs
      : english.availableLangs,
  };
}

/** Derive the edition id (date) from an `edition-YYYY-MM-DD.md` filename. */
export function editionIdFromFilename(filename: string): string | null {
  const match = filename.match(/^edition-(\d{4}-\d{2}-\d{2})\.md$/);
  return match ? match[1] : null;
}

/** `edition-YYYY-MM-DD.<lang>.md` → `{ date, lang }` or null. */
export function langEditionFromFilename(
  filename: string,
): { date: string; lang: Lang } | null {
  const match = filename.match(/^edition-(\d{4}-\d{2}-\d{2})\.([a-z]{2})\.md$/);
  if (!match) return null;
  const lang = match[2];
  if (lang.length !== 2) return null;
  return { date: match[1], lang: lang as Lang };
}
