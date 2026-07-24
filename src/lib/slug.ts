/**
 * Anchor/URL slug generation.
 *
 * Mirrors the backend's TOC anchor algorithm exactly so a same-page table of
 * contents and the per-story routes agree:
 *
 *   lowercase "<n>. <headline>", keep alphanumerics, turn space/`-`/`_` into
 *   `-`, drop every other character, collapse repeated `-`, trim leading and
 *   trailing `-`.
 *
 * The RAW headline (including any " - source" scrape suffix) is used, matching
 * the anchors emitted in the "In this edition" list.
 */
export function storySlug(index: number, rawHeadline: string): string {
  const source = `${index}. ${rawHeadline}`.toLowerCase();
  let out = "";
  for (const ch of source) {
    if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else if (ch === " " || ch === "-" || ch === "_") {
      out += "-";
    }
    // every other character is dropped
  }
  return out.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
