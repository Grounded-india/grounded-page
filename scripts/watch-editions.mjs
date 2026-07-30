#!/usr/bin/env node
/**
 * watch-editions
 * --------------
 * The automated half of the GROUNDED ingest pipeline. It watches the backend's
 * output folder and, the moment a new (or updated) `edition-YYYY-MM-DD.md` lands,
 * copies it into `content/editions/` so the site can render it. The front page
 * lays the stories out by importance on its own (see src/lib/importance.ts), so
 * dropping in a file is the ONLY action needed to publish an edition.
 *
 * Two modes:
 *   node scripts/watch-editions.mjs            # sync + watch (pairs with `next dev`)
 *   node scripts/watch-editions.mjs --build    # sync + watch + auto `next build`
 *
 * In dev, `next dev` re-reads the Markdown on every request, so a browser refresh
 * shows the new edition. In --build mode we regenerate the static export instead,
 * which is what a production/CI deploy wants.
 *
 * Env:
 *   SOURCE_DIR=/path/to/output   # override the backend output folder
 */
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync, watch } from "node:fs";
import { spawn } from "node:child_process";
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
const EDITION_RE = /^edition-\d{4}-\d{2}-\d{2}\.md$/;
const shouldBuild = process.argv.includes("--build");

// Poll interval as a safety net in case fs.watch drops an event on this OS.
const POLL_MS = 4000;
// Wait this long after the last change before acting (backend may write in bursts).
const DEBOUNCE_MS = 800;

const log = (msg) => console.log(`[watch:editions] ${msg}`);

async function syncImages() {
  if (!existsSync(IMAGES_SRC)) return false;
  await mkdir(IMAGES_DEST, { recursive: true });
  const dates = await readdir(IMAGES_SRC);
  let any = false;
  for (const name of dates) {
    const from = path.join(IMAGES_SRC, name);
    const to = path.join(IMAGES_DEST, name);
    if (!(await stat(from)).isDirectory()) continue;
    await cp(from, to, { recursive: true });
    any = true;
  }
  return any;
}

/** Copy edition files whose size/mtime differ from the destination. */
async function syncOnce() {
  await mkdir(DEST_DIR, { recursive: true });
  if (!existsSync(SOURCE_DIR)) return [];

  const entries = await readdir(SOURCE_DIR);
  const editions = entries.filter((name) => EDITION_RE.test(name)).sort();

  const changed = [];
  for (const name of editions) {
    const from = path.join(SOURCE_DIR, name);
    const to = path.join(DEST_DIR, name);
    const src = await stat(from).catch(() => null);
    if (!src || !src.isFile()) continue;

    const dst = await stat(to).catch(() => null);
    const differs = !dst || dst.size !== src.size || dst.mtimeMs < src.mtimeMs;
    if (differs) {
      await cp(from, to);
      changed.push(name);
    }
  }

  // Always refresh photographs alongside Markdown — cheap, and keeps captions
  // that land mid-write from pointing at a missing file.
  if (await syncImages()) {
    if (!changed.includes("images/")) changed.push("images/");
  }
  return changed;
}

// --- optional auto-build, guarded so we never run two builds at once ---------
let building = false;
let buildQueued = false;

function runBuild() {
  if (building) {
    buildQueued = true;
    return;
  }
  building = true;
  log("change detected -> rebuilding static site (next build)...");
  const child = spawn("npm", ["run", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => {
    building = false;
    log(code === 0 ? "build complete. out/ is up to date." : `build exited with code ${code}.`);
    if (buildQueued) {
      buildQueued = false;
      runBuild();
    }
  });
}

// --- debounced reaction to changes -------------------------------------------
let timer = null;
function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const changed = await syncOnce().catch((err) => {
      console.error("[watch:editions] sync failed:", err);
      return [];
    });
    if (changed.length === 0) return;
    log(`synced ${changed.length} edition(s): ${changed.join(", ")}`);
    if (shouldBuild) runBuild();
  }, DEBOUNCE_MS);
}

async function waitForSourceDir() {
  if (existsSync(SOURCE_DIR)) return;
  log(`waiting for backend output folder to appear: ${SOURCE_DIR}`);
  await new Promise((resolve) => {
    const iv = setInterval(() => {
      if (existsSync(SOURCE_DIR)) {
        clearInterval(iv);
        resolve();
      }
    }, POLL_MS);
  });
}

async function main() {
  log(`source : ${SOURCE_DIR}`);
  log(`dest   : ${DEST_DIR}`);
  log(shouldBuild ? "mode   : sync + auto-build" : "mode   : sync only (use with `next dev`)");
  log("trigger: run `python publish.py` in the GROUNDED repo — this picks it up automatically.");

  await waitForSourceDir();

  const initial = await syncOnce();
  log(initial.length ? `initial sync copied: ${initial.join(", ")}` : "initial sync: content/editions already current.");

  // Event-driven: react instantly when the backend writes a file.
  try {
    watch(SOURCE_DIR, { persistent: true }, (_event, filename) => {
      if (!filename || EDITION_RE.test(filename) || filename === "images") {
        scheduleSync();
      }
    });
    if (existsSync(IMAGES_SRC)) {
      watch(IMAGES_SRC, { persistent: true, recursive: true }, () => {
        scheduleSync();
      });
    }
  } catch (err) {
    log(`fs.watch unavailable (${err.code || err.message}); falling back to polling only.`);
  }

  // Safety-net poll in case an event is missed (macOS sometimes drops fs.watch events).
  setInterval(scheduleSync, POLL_MS);

  log("watching for new editions. press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("[watch:editions] fatal:", err);
  process.exit(1);
});
