# GROUNDED — the reader-facing broadsheet

A vintage newspaper website for **GROUNDED**, the autonomous, fact-grounded news
service. This is the *reader frontend* only. It renders daily editions as an
aged, letterpress broadsheet — ink on paper, not pixels on a screen.

> **The brand promise is credibility through transparency.** Every claim is tied
> to its sources. Stories without a primary/official source are not dropped —
> they are presented as a two-sided **Debate**.

---

## The one hard rule

**The frontend never calls the backend, a database, or any API.** Its only input
is Markdown files the Python pipeline writes, one per daily edition. Those files
are ingested at **build time** and rendered as a static site (SSG). The shipped
site is a pure static export (`output: "export"`) — there is no server runtime
and there are **zero network/API/DB calls** at read time. Fonts are self-hosted;
the paper texture is bundled.

### Integration contract

- The backend produces files named exactly **`edition-YYYY-MM-DD.md`** (the date
  is the edition id).
- They are read from **`content/editions/*.md`**.
- **A new edition is just a new file dropped into that folder → rebuild.** No
  code changes, ever.
- `npm run sync:editions` copies `../GROUNDED/output/*.md` into
  `content/editions/`. That copy step is the *only* coupling to the backend.

```
GROUNDED (backend) ──writes──▶ ../GROUNDED/output/edition-YYYY-MM-DD.md
                                        │
                          npm run sync:editions   (cp only — no imports, no API)
                                        ▼
grounded-page ──reads at build──▶ content/editions/*.md ──▶ static broadsheet (out/)
```

---

## Quick start

```bash
npm install
npm run sync:editions   # copy editions from ../GROUNDED/output
npm run dev             # http://localhost:3000
```

Build the static site:

```bash
npm run build           # prebuild re-syncs editions, then exports to ./out
npx serve out           # preview the static export (optional)
```

Run the parser tests:

```bash
npm test
```

### Pointing at a different backend output folder

`sync:editions` defaults to `../GROUNDED/output`. Override it:

```bash
SOURCE_DIR=/path/to/output npm run sync:editions
```

`npm run build` runs `sync-editions --allow-missing` first, so a build still
succeeds against whatever already lives in `content/editions/` even if the
backend folder isn't present.

---

## Adding an edition (the whole workflow)

1. The pipeline writes `edition-2026-07-23.md` into its `output/` folder.
2. `npm run sync:editions` (or just `npm run build`, which syncs first).
3. Rebuild. The new date becomes the front page; older issues fall into the
   Archive. **No code is touched.**

---

## The Markdown contract

Each edition is split on lines that are exactly `---` into
`[header + TOC] · [story 1] · … · [footer]`. The parser is hand-written for this
fixed grammar (no YAML frontmatter, so no `gray-matter`). `react-markdown` +
`remark-gfm` are used **only** to render inline Markdown inside prose fields
(bold, italics, links) — never to structure the page.

Parsed into a typed model (`src/lib/types.ts`):

- **Header** → human date + story count.
- **Story** → `## <n>. <headline>` (index, headline), optional italic dek,
  a `>` badge line (`MODE · N sources · N claim(s) kept · [N verified]`),
  a `### Context` section, then either a **Debate** (Side A / Side B) +
  **Grounded points**, or **What we know**, plus a `**Sources:**` line.
- **Claim** → `- <text> — *<Outlet, Outlet>* _(primary-source backed)_`.

Handled data quirks (degrade gracefully, never crash):

- **Scrape suffixes** (`- api.sci.gov.in`, `- PIB`, `- The Hindu`, …) are
  stripped for *display* but kept in the raw headline used for the anchor/slug.
- **Empty Side B** renders a tasteful editorial note.
- **Inline debate citations** (`(the_hindu)`) are humanized to `(The Hindu)`;
  ordinary parentheticals like `(AP)` are left alone.
- **Embedded em-dashes** inside a claim's text are preserved.

The parser is validated against the real sample edition
(`content/editions/edition-2026-07-21.md`) in `src/lib/parser.test.ts` — 23
assertions covering story count, an empty-Side-B debate, a report story,
primary-source detection, slug/anchor parity, and the source lists.

---

## Pages

| Route                    | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `/`                      | The latest edition as a broadsheet front page.                 |
| `/edition/[date]`        | A specific edition's front page.                               |
| `/story/[date]/[slug]`   | A single story (Context, Debate or What-we-know, claims, prev/next). |
| `/archive`               | All back-issues, newest first.                                 |
| `/about`                 | The methodology — the six-layer pipeline and the credibility thesis. |

Edition dates are derived from the **filename**; the human date is read from the
header line. Editions sort newest-first; `/` renders the newest.

---

## Design

An aged broadsheet, derived from the supplied paper scan
(`public/textures/paper.png`, applied site-wide, fixed, with a cream wash for
legibility).

- **Palette** — ivory paper `#F3ECDD`, warm-black ink `#211C15`, faded sepia
  `#6B5D4A`, a single oxblood accent `#7B2D26` (nameplate rule + Debate stamp),
  antique gold `#9A7B3F` (primary-source seal).
- **Type** — UnifrakturMaguntia nameplate, Playfair Display headlines, Source
  Serif 4 body (justified, hyphenated). Self-hosted via `next/font`.
- **Motifs** — blackletter masthead with hairline + double rule, a drop-capped
  lead story, ruled multi-column grid, letterpress mode stamps, a wax-seal for
  primary-source claims, small-caps kickers. Motion is minimal and respects
  `prefers-reduced-motion`.

---

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · static export
(`generateStaticParams` reading `content/editions/*.md` via Node `fs` at build
time) · `react-markdown` + `remark-gfm` for inline prose · `framer-motion` for a
restrained page-turn · Vitest for the parser.

## Project structure

```
content/editions/        edition-YYYY-MM-DD.md  (the only input)
public/textures/         paper.png              (bundled background)
scripts/sync-editions.mjs                        (the only backend coupling)
src/lib/                 types · slug · humanize · parser · editions loader · tests
src/components/          Masthead, FrontPage, StoryArticle, DebateSpread,
                         ModeStamp, PrimarySeal, ClaimList, CitedSources, Prose, …
src/app/                 /, /edition/[date], /story/[date]/[slug], /archive, /about
```

---

*Published by machine; grounded in sources. Every claim, a citation.*
