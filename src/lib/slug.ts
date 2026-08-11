/**
 * Anchor/URL slug generation.
 *
 * Mirrors the backend's TOC anchor algorithm (`grounded.agents.edition._slug`)
 * so a same-page table of contents and the per-story routes agree:
 *
 *   lowercase "<n>. <headline>", keep Unicode letters/numbers AND Unicode mark
 *   characters (Mn/Mc/Me — Devanagari matras, virama, etc.), turn space/`-`/`_`
 *   into `-`, drop every other character, collapse repeated `-`, trim edges.
 *
 * Keeping category M* is required for Indic-script TOC anchors; stripping them
 * would leave vowel signs out of the slug while the rendered heading still has
 * them. No effect on ASCII English headlines.
 */
export function storySlug(index: number, rawHeadline: string): string {
  const source = `${index}. ${rawHeadline}`.toLowerCase();
  let out = "";
  for (const ch of source) {
    // \p{L} letters, \p{N} numbers, \p{M} combining marks (matras, virama, …)
    if (/\p{L}|\p{N}|\p{M}/u.test(ch)) {
      out += ch;
    } else if (ch === " " || ch === "-" || ch === "_") {
      out += "-";
    }
  }
  // NFC so App Router params, TOC anchors, and filesystem paths agree on macOS
  // (which often stores filenames as NFD).
  return out.replace(/-+/g, "-").replace(/^-+|-+$/g, "").normalize("NFC");
}
