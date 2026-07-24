/**
 * Humanizing raw outlet slugs.
 *
 * Claim/`**Sources:**` lines already carry human-readable names, but the inline
 * debate citations are raw slugs like "(the_hindu)". We turn those into
 * presentable names for display.
 */

const KNOWN_OUTLETS: Record<string, string> = {
  the_hindu: "The Hindu",
  reuters_india: "Reuters India",
  ap_india: "AP India",
  ap_news: "AP News",
  prs_india: "PRS India",
  prsindia: "PRS India",
  pib: "PIB",
  rbi: "RBI",
  supreme_court: "Supreme Court",
  google_news_india: "Google News India",
  indian_express: "Indian Express",
  the_times_of_india: "The Times of India",
  ndtv: "NDTV",
  pti: "PTI",
};

// Tokens that should be fully upper-cased when title-casing an unknown slug.
const ACRONYMS = new Set([
  "ap",
  "pib",
  "rbi",
  "pti",
  "un",
  "us",
  "uk",
  "eu",
  "mea",
  "cji",
  "sc",
  "sci",
  "gst",
  "rti",
  "ndtv",
]);

export function humanizeOutlet(slug: string): string {
  const key = slug.trim().toLowerCase();
  if (KNOWN_OUTLETS[key]) return KNOWN_OUTLETS[key];

  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** True when a token looks like a source slug rather than ordinary prose. */
function looksLikeSlug(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  if (KNOWN_OUTLETS[t.toLowerCase()]) return true;
  // snake_case, lowercase, with at least one underscore — safe to treat as a slug
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(t);
}

/**
 * Replace inline debate citations — "(the_hindu)" or
 * "(google_news_india, indian_express)" — with humanized names, leaving
 * ordinary parentheticals like "(AP)" or "(BY CIRCULATION)" untouched.
 */
export function humanizeInlineCitations(markdown: string): string {
  return markdown.replace(/\(([^()]+)\)/g, (whole, inner: string) => {
    const tokens = inner.split(",").map((s) => s.trim());
    if (tokens.length === 0 || !tokens.every(looksLikeSlug)) {
      return whole; // not a citation group — leave as written
    }
    return `(${tokens.map(humanizeOutlet).join(", ")})`;
  });
}
