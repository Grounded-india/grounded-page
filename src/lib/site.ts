/**
 * Canonical site constants used by metadata, sitemap, and JSON-LD.
 * Override at build time with NEXT_PUBLIC_SITE_URL if the live host differs
 * (e.g. a *.vercel.app preview).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thegroundedtimes.info"
).replace(/\/$/, "");

export const SITE_NAME = "The Grounded Times";
export const SITE_TAGLINE = "Someone has to keep you grounded.";
export const SITE_DESCRIPTION =
  "The Grounded Times — an autonomous, fact-grounded daily newspaper for India. Every claim is extracted from source material, verified against its citations, and audited for hallucination. Report when grounded; Debate when contested.";

export const SITE_KEYWORDS = [
  "The Grounded Times",
  "GROUNDED",
  "fact-checked news India",
  "source-cited news",
  "AI news India",
  "transparent journalism",
  "Indian newspaper",
  "fact-grounded daily",
  "auditable news",
  "debate vs report news",
];
