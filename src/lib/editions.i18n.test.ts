import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  discoverLangs,
  discoverSiteLangs,
  getEdition,
  langSwitcherFor,
  latestDateForLang,
  loadEdition,
} from "./editions";
import { parseEdition, mergeEditions, resolveImageSrc } from "./parser";

const DATE = "2026-08-03";
const HI = path.join(
  process.cwd(),
  "content",
  "editions",
  DATE,
  `edition-${DATE}.hi.md`,
);
const KN = path.join(
  process.cwd(),
  "content",
  "editions",
  DATE,
  `edition-${DATE}.kn.md`,
);

describe("multilingual editions — 2026-08-03", () => {
  it("discovers en + hi (+ others) for the sample date", () => {
    if (!fs.existsSync(HI)) return;
    const langs = discoverLangs(DATE);
    expect(langs).toContain("en");
    expect(langs).toContain("hi");
    expect(langs).toContain("kn");
  });

  it("Hindi merge keeps English story count, modes, and resolved images", () => {
    if (!fs.existsSync(HI)) return;

    const en = getEdition(DATE, "en");
    const hi = getEdition(DATE, "hi");
    expect(en).toBeDefined();
    expect(hi).toBeDefined();
    expect(hi!.stories.length).toBe(en!.stories.length);
    expect(hi!.lang).toBe("hi");
    expect(hi!.availableLangs).toEqual(expect.arrayContaining(["en", "hi"]));

    // Lead story is Hindi prose with English structural mode.
    const lead = hi!.stories[0];
    expect(lead.mode).toBe("report");
    expect(lead.headline).toMatch(/स्पोकेन|जंगलात|आग/);
    expect(lead.images.length).toBeGreaterThan(0);
    for (const img of lead.images) {
      expect(img.src.startsWith("/images/")).toBe(true);
      expect(img.src.includes("../")).toBe(false);
    }

    // Debate stories stay debate after merge.
    const debates = hi!.stories.filter((s) => s.mode === "debate");
    expect(debates.length).toBe(
      en!.stories.filter((s) => s.mode === "debate").length,
    );
    expect(debates.length).toBeGreaterThan(0);
    for (const d of debates) {
      expect(d.debate?.turns.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("Kannada edition parses with matching story count", () => {
    if (!fs.existsSync(KN)) return;
    const en = getEdition(DATE, "en")!;
    const kn = getEdition(DATE, "kn")!;
    expect(kn.stories.length).toBe(en.stories.length);
    expect(kn.lang).toBe("kn");
    expect(kn.stories[0].headline.length).toBeGreaterThan(5);
    expect(kn.stories[0].images[0]?.src).toMatch(/^\/images\/2026-08-03\//);
  });

  it("mergeEditions falls back to English when a translated story is missing", () => {
    if (!fs.existsSync(HI)) return;
    const en = parseEdition(
      fs.readFileSync(path.join(process.cwd(), "content/editions", `edition-${DATE}.md`), "utf8"),
      DATE,
      "en",
      ["en", "hi"],
    );
    const hiRaw = parseEdition(fs.readFileSync(HI, "utf8"), DATE, "hi", [
      "en",
      "hi",
    ]);
    // Drop one story from the translation to simulate a partial file.
    const partial = {
      ...hiRaw,
      stories: hiRaw.stories.filter((s) => s.index !== 2),
    };
    const merged = mergeEditions(en, partial);
    expect(merged.stories.length).toBe(en.stories.length);
    const story2 = merged.stories.find((s) => s.index === 2)!;
    expect(story2.headline).toBe(en.stories.find((s) => s.index === 2)!.headline);
  });

  it("loadEdition is the public entry used by routes", () => {
    if (!fs.existsSync(HI)) return;
    const edition = loadEdition(DATE, "hi");
    expect(edition?.stories[0].images.every((i) => resolveImageSrc(i.src) === i.src)).toBe(
      true,
    );
  });

  it("site-wide switcher appears even on English-only latest editions", () => {
    if (!fs.existsSync(HI)) return;
    const site = discoverSiteLangs();
    expect(site).toEqual(expect.arrayContaining(["en", "hi", "kn", "mr", "te"]));
    const newestHi = latestDateForLang("hi");
    expect(newestHi).toBeTruthy();
    expect(newestHi! >= DATE).toBe(true);

    const latest = getEdition(getEdition("2026-08-11", "en") ? "2026-08-11" : DATE, "en");
    // Prefer the live English frontpage date when present.
    const date = latest?.date ?? DATE;
    const switcher = langSwitcherFor(date, "en", { homeEnglish: true });
    expect(switcher.availableLangs.length).toBeGreaterThan(1);
    expect(switcher.hrefByLang.en).toBe("/");
    expect(switcher.hrefByLang.hi).toBe(`/edition/${newestHi}/hi/`);
  });
});

describe("getStory Indic slug lookup", () => {
  it("resolves Hindi lead by its Indic slug and by index prefix", async () => {
    const { getEdition, getStory } = await import("./editions");
    const hi = getEdition("2026-08-03", "hi");
    if (!hi) return;
    const lead = hi.stories[0];
    const found = getStory("2026-08-03", lead.slug, "hi");
    expect(found?.story.index).toBe(1);
    expect(found?.story.images.length).toBeGreaterThan(0);
    const byPrefix = getStory("2026-08-03", "1-not-the-real-slug", "hi");
    expect(byPrefix?.story.index).toBe(1);
  });
});
