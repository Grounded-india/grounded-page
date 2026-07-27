#!/usr/bin/env node
/**
 * sync-editions
 * -------------
 * The ONLY coupling between this frontend and the GROUNDED backend: it copies
 * the daily edition Markdown files the pipeline writes to `../GROUNDED/output/`
 * into this app's `content/editions/` folder. Nothing else about the backend is
 * imported or called.
 *
 * Contract:
 *   - Backend writes files named exactly `edition-YYYY-MM-DD.md`.
 *   - We copy `edition-*.md` into `content/editions/`.
 *   - A new edition is just a new file dropped in → rebuild. No code changes.
 *
 * On Vercel / CI the sibling GROUNDED repo is absent. Always commit the editions
 * you want live into `content/editions/`, and use `--allow-missing` (the default
 * for `prebuild`) so the build uses those committed files instead of failing.
 *
 * Usage:
 *   node scripts/sync-editions.mjs                 # copy, fail loudly if source missing
 *   node scripts/sync-editions.mjs --allow-missing # copy if present, else no-op (used by prebuild)
 *   SOURCE_DIR=/path/to/output node scripts/sync-editions.mjs
 */
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SOURCE_DIR = process.env.SOURCE_DIR
  ? path.resolve(process.env.SOURCE_DIR)
  : path.resolve(repoRoot, "..", "GROUNDED", "output");

const DEST_DIR = path.resolve(repoRoot, "content", "editions");
const EDITION_RE = /^edition-\d{4}-\d{2}-\d{2}\.md$/;
const allowMissing = process.argv.includes("--allow-missing");

async function main() {
  await mkdir(DEST_DIR, { recursive: true });

  if (!existsSync(SOURCE_DIR)) {
    const msg = `[sync:editions] Source folder not found: ${SOURCE_DIR}`;
    if (allowMissing) {
      console.warn(`${msg} — using whatever already lives in content/editions/.`);
      return;
    }
    console.error(`${msg}\nSet SOURCE_DIR or check that the GROUNDED backend is a sibling folder.`);
    process.exit(1);
  }

  const entries = await readdir(SOURCE_DIR);
  const editions = entries.filter((name) => EDITION_RE.test(name)).sort();

  if (editions.length === 0) {
    const msg = `[sync:editions] No edition-YYYY-MM-DD.md files in ${SOURCE_DIR}`;
    if (allowMissing) {
      console.warn(`${msg} — using existing content/editions/.`);
      return;
    }
    console.error(msg);
    process.exit(1);
  }

  let copied = 0;
  for (const name of editions) {
    const from = path.join(SOURCE_DIR, name);
    const to = path.join(DEST_DIR, name);
    if ((await stat(from)).isFile()) {
      await cp(from, to);
      copied += 1;
    }
  }

  console.log(`[sync:editions] Copied ${copied} edition(s) → content/editions/`);
  for (const name of editions) console.log(`  · ${name}`);
}

main().catch((err) => {
  console.error("[sync:editions] Failed:", err);
  process.exit(1);
});
