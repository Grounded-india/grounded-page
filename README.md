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

### The publish workflow (two repos, zero manual copy)

This is the day-to-day loop. Keep the site watching; publish from the backend.

**Terminal A — this repo (leave it running):**

```bash
npm run publish:live    # alias for `dev:pipeline` = next dev + edition watcher
# http://localhost:3000
```

**Terminal B — the GROUNDED backend:**

```bash
cd ../GROUNDED
python publish.py       # writes output/edition-YYYY-MM-DD.md AND copies it here
```

```
python publish.py  (GROUNDED)
        │
        ├─ writes  ../GROUNDED/output/edition-YYYY-MM-DD.md
        └─ copies  grounded-page/content/editions/edition-YYYY-MM-DD.md
                        │
                        ▼
         watch-editions.mjs also tails output/ (belt + suspenders)
                        │
                        ▼
         next dev re-reads on refresh → importance layout → live front page
```

`publish.py` pushes the file into this repo directly. The watcher is a safety net
for anything else that lands in `../GROUNDED/output/`. Either path is enough —
together they make a missed copy almost impossible.

```bash
npm run publish:live    # recommended: site + watcher together
npm run pipeline        # watcher + auto `next build` (prod/CI static export)
npm run watch:editions  # watcher only
npm run sync:editions   # one-shot copy, no watch
```

In **dev**, editions are re-read from disk on every request (no build cache), so a
synced file shows up on the next browser refresh. In **production** the site is a
static export, so `npm run pipeline` runs `next build` for you on each new file.

---

## Quick start

```bash
npm install
npm run publish:live    # site + auto-ingest watcher → http://localhost:3000
```

In the sibling backend repo, whenever an edition is ready:

```bash
cd ../GROUNDED
python publish.py       # writes + copies the Markdown here; refresh the browser
```

One-shot sync / build without the watcher:

```bash
npm run sync:editions   # copy editions from ../GROUNDED/output
npm run build           # prebuild re-syncs editions, then exports to ./out
npx serve out           # preview the static export (optional)
```

Run the parser tests:

```bash
npm test
```

### Deploy (Vercel — frontend only)

This site is a static Next.js export. The Python backend is **not** required at
runtime. Vercel builds from the Markdown already committed under
`content/editions/`.

1. Push this repo to GitHub (including `content/editions/*.md`).
2. Import the repo in Vercel → Framework Preset **Next.js** → Deploy.
3. Leave env vars empty. No backend URL needed.

After each new edition: run `python publish.py` in GROUNDED (or copy the
`.md` into `content/editions/`), commit, and push — Vercel rebuilds the archive
automatically.

`prebuild` syncs from `../GROUNDED/output` when that folder exists locally; on
Vercel it no-ops (`--allow-missing`) and uses the committed editions.

---

## Adding an edition (the whole workflow)

**Recommended — automated:**

1. Leave `npm run publish:live` running in this repo.
2. In `../GROUNDED`, run `python publish.py` (after the agent crew has built stories).
3. Refresh the browser. The new date is the front page; older issues fall into the
   Archive. Importance scoring decides the lead, featured rotation, column grid,
   and "In Brief" rail on its own. **No frontend code is touched.**

**Manual (no watcher):**

1. `python publish.py` in GROUNDED (or drop `edition-YYYY-MM-DD.md` into `output/`).
2. `npm run sync:editions` here (skipped if `publish.py` already copied it).
3. `npm run build` (or refresh if `next dev` is already running).

---

## How stories are positioned (importance scoring)

The backend already emits stories in ranked order (story 1 = most important; it
deliberately down-weights outrage/celebrity/virality). The frontend treats that
rank as the **dominant** signal and layers a transparent, auditable score on top
(`src/lib/importance.ts`) so the page can arrange itself with no human touch.

**The score (0–100), heaviest weight first:**

| Signal            | Why it matters                                              | Weight |
| ----------------- | ----------------------------------------------------------- | -----: |
| Editorial rank    | Where the backend placed the story (dominant)               |  ~40   |
| Source tier       | primary/official ▸ wire ▸ social-aggregator                 | 20/10/3|
| Grounding         | report mode + primary-source-backed + verified claims       |  ~24   |
| Corroboration     | number of **distinct** outlets                              |  ~12   |
| Volume            | how many source items were scraped (attention proxy)        |   ~7   |
| Substance         | how many claims survived verification                       |  ~10   |
| Debate penalty    | contested, no primary source                                |   −4   |

The score maps to a **layout tier**, which is what actually positions the story:

- **Lead** — the single highest-scoring substantive story → the hero.
- **Feature** — the next two → they rotate through the hero with the lead.
- **Standard** — the body → the ruled column grid.
- **Brief** — terse single-source/single-claim items (raw filings, lone wire
  snippets) → the **In Brief** rail.

A small "signal-strength" **impact meter** on each teaser/article surfaces the
reading (High / Notable / Moderate / Routine). `src/lib/importance.test.ts`
locks this behaviour to the sample edition.

**Ideas to make it sharper — push the score into the backend.** The frontend can
only infer so much. The parser already reads an optional `impact N` token from a
story's badge line, and if present it is used **verbatim**, overriding the
heuristic. So the highest-fidelity path is for the backend (which sees the raw
signal) to stamp an explicit importance score, e.g.:

```
> REPORT · 1 sources · 3 claim(s) kept · 3 verified · impact 87
```

Other backend-side upgrades worth considering: a topic tag (policy / markets /
world / sport / culture) so soft news can be down-weighted precisely, and a
recency/half-life so a running story decays over the day.

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
primary-source detection, slug/anchor parity, and the source lists. A second
suite, `src/lib/importance.test.ts`, locks the scoring and layout tiers (14 more
assertions).

---

## Pages

| Route                    | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `/`                      | The latest edition, arranged by importance: a rotating hero of the top stories, a column grid, and an "In Brief" rail. |
| `/edition/[date]`        | A specific edition's front page (same importance layout).      |
| `/story/[date]/[slug]`   | A single story (Context, Debate or What-we-know, claims, impact meter, prev/next). |
| `/archive`               | All back-issues as miniature front-page cards, grouped by month, newest first. |
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
scripts/sync-editions.mjs                        (one-shot copy — the backend coupling)
scripts/watch-editions.mjs                       (auto-ingest watcher: sync [+ build])
src/lib/                 types · slug · humanize · parser · importance · editions loader · tests
src/components/          Masthead, FrontPage, FeaturedCarousel, StoryTeaser, BriefsList,
                         ImpactMeter, StoryArticle, DebateSpread, ModeStamp, PrimarySeal,
                         ClaimList, CitedSources, Prose, …
src/app/                 /, /edition/[date], /story/[date]/[slug], /archive, /about
```

---

*Published by machine; grounded in sources. Every claim, a citation.*
