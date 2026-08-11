#!/usr/bin/env node
/**
 * sync-editions
 * -------------
 * The ONLY coupling between this frontend and the GROUNDED backend: it copies
 * the daily edition Markdown files (and their photograph folders) the pipeline
 * writes to `../GROUNDED/output/` into this app so the site can render them.
 *
 * Contract:
 *   - Backend writes flat English files named `edition-YYYY-MM-DD.md`.
 *   - Backend writes multilingual bundles under
 *     `output/editions/<date>/edition-<date>.<lang>.md` (always includes `.en.md`).
 *   - Backend writes photographs under `output/images/<date>/…`.
 *   - We copy flat files → `content/editions/`, nested bundles →
 *     `content/editions/<date>/`, and images → `public/images/`.
 *   - A new edition is just a new file dropped in → rebuild. No code changes.
 *
 * On Vercel / CI the sibling GROUNDED repo is absent. Always commit the editions
 * (and images) you want live, and use `--allow-missing` (the default for
 * `prebuild`) so the build uses those committed files instead of failing.
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
const IMAGES_SRC = path.join(SOURCE_DIR, "images");
const IMAGES_DEST = path.resolve(repoRoot, "public", "images");
const LANG_BUNDLE_SRC = path.join(SOURCE_DIR, "editions");
const EDITION_RE = /^edition-\d{4}-\d{2}-\d{2}\.md$/;
const LANG_EDITION_RE = /^edition-\d{4}-\d{2}-\d{2}\.[a-z]{2}\.md$/;
const DATE_DIR_RE = /^\d{4}-\d{2}-\d{2}$/;
const allowMissing = process.argv.includes("--allow-missing");

async function syncImages() {
  if (!existsSync(IMAGES_SRC)) return 0;
  await mkdir(IMAGES_DEST, { recursive: true });
  const dates = await readdir(IMAGES_SRC);
  let folders = 0;
  for (const name of dates) {
    const from = path.join(IMAGES_SRC, name);
    const to = path.join(IMAGES_DEST, name);
    if (!(await stat(from)).isDirectory()) continue;
    await cp(from, to, { recursive: true });
    folders += 1;
  }
  return folders;
}

/** Copy `output/editions/<date>/*.md` → `content/editions/<date>/`. */
async function syncLangBundles() {
  if (!existsSync(LANG_BUNDLE_SRC)) return { folders: 0, files: 0 };
  const dates = await readdir(LANG_BUNDLE_SRC);
  let folders = 0;
  let files = 0;
  for (const name of dates) {
    if (!DATE_DIR_RE.test(name)) continue;
    const fromDir = path.join(LANG_BUNDLE_SRC, name);
    if (!(await stat(fromDir)).isDirectory()) continue;
    const toDir = path.join(DEST_DIR, name);
    await mkdir(toDir, { recursive: true });
    const entries = await readdir(fromDir);
    let copiedHere = 0;
    for (const file of entries) {
      if (!LANG_EDITION_RE.test(file) && !EDITION_RE.test(file)) continue;
      const from = path.join(fromDir, file);
      const to = path.join(toDir, file);
      if (!(await stat(from)).isFile()) continue;
      await cp(from, to);
      copiedHere += 1;
    }
    if (copiedHere > 0) {
      folders += 1;
      files += copiedHere;
    }
  }
  return { folders, files };
}

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

  if (editions.length === 0 && !existsSync(LANG_BUNDLE_SRC)) {
    const msg = `[sync:editions] No edition-YYYY-MM-DD.md files in ${SOURCE_DIR}`;
    if (allowMissing) {
      console.warn(`${msg} — using existing content/editions/.`);
    } else {
      console.error(msg);
      process.exit(1);
    }
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

  const lang = await syncLangBundles();
  const imageFolders = await syncImages();

  console.log(`[sync:editions] Copied ${copied} flat edition(s) → content/editions/`);
  for (const name of editions) console.log(`  · ${name}`);
  if (lang.files > 0) {
    console.log(
      `[sync:editions] Synced ${lang.files} multilingual file(s) across ${lang.folders} date folder(s)`,
    );
  }
  if (imageFolders > 0) {
    console.log(`[sync:editions] Synced ${imageFolders} image folder(s) → public/images/`);
  }
}

main().catch((err) => {
  console.error("[sync:editions] Failed:", err);
  process.exit(1);
});
