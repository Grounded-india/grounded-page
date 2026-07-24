/**
 * Typed model for a GROUNDED edition, parsed from a single
 * `edition-YYYY-MM-DD.md` file. See `parser.ts` for the exact grammar.
 */

export type Mode = "debate" | "report";

export interface Claim {
  /** The verified claim text, rendered as-is (may be a terse wire headline). */
  text: string;
  /** Human-readable outlet names, already presentable (e.g. "The Hindu"). */
  outlets: string[];
  /** True when the claim carries the "primary-source backed" tag. */
  primarySourceBacked: boolean;
}

export interface Side {
  /** e.g. "Supporters' account", "What is being reported". */
  label: string;
  /** Markdown body. MAY be an empty string (Side B is often absent). */
  body: string;
}

export interface StoryBadges {
  sources: number;
  claimsKept: number;
  /** Present in report mode only. */
  verified?: number;
}

export interface Story {
  /** 1-based position within the edition (from "## <n>. ..."). */
  index: number;
  /** URL/anchor slug derived from the RAW "<n>. <headline>". */
  slug: string;
  /** Display headline with any scrape suffix (" - PIB") stripped. */
  headline: string;
  /** The unmodified headline, kept for anchors/titles. */
  rawHeadline: string;
  mode: Mode;
  /** Optional standfirst/dek (single italic line under the heading). */
  dek?: string;
  badges: StoryBadges;
  /** Context prose as Markdown (always present). */
  context: string;
  /** Present when mode === "debate". */
  debate?: { sideA: Side; sideB: Side };
  /** "Grounded points" (debate) or "What we know" (report). */
  claims: Claim[];
  /** Per-story cited outlets, already human-readable. */
  sources: string[];
}

export interface Edition {
  /** Edition id === date === "YYYY-MM-DD" (derived from the filename). */
  id: string;
  /** Same as id; ISO date string. */
  date: string;
  /** Human date from the header dateline, e.g. "Tuesday, 21 July 2026". */
  humanDate: string;
  /** Story count declared in the header dateline. */
  storyCount: number;
  stories: Story[];
}

/** Lightweight edition metadata for archive/index listings. */
export interface EditionMeta {
  id: string;
  date: string;
  humanDate: string;
  storyCount: number;
  /** Chronological issue number (oldest edition === No. 1). */
  issueNumber: number;
  leadHeadline: string;
  debateCount: number;
  reportCount: number;
}
