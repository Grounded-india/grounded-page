import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseEdition } from "./parser";
import { cleanDek, hasContextBody, reconstructionNote, splitContext, storyLede } from "./content";
import type { Edition } from "./types";

const FIXTURE_ID = "2026-07-21";
const FIXTURE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "__fixtures__",
  `edition-${FIXTURE_ID}.md`,
);

function loadFixture(): Edition {
  return parseEdition(fs.readFileSync(FIXTURE_PATH, "utf8"), FIXTURE_ID);
}

describe("cleanDek", () => {
  const edition = loadFixture();
  const byIndex = (i: number) => edition.stories.find((s) => s.index === i)!;

  it("drops a dek that just echoes the headline (stub report)", () => {
    const s = byIndex(3); // SC curative/review list — dek repeats the title
    expect(cleanDek(s.dek, s.headline)).toBeNull();
  });

  it("drops a dek that is only the machine 'Contested: …' prefix", () => {
    const s = byIndex(4); // gas prices — dek is just "Contested: 2 outlet(s), …"
    expect(cleanDek(s.dek, s.headline)).toBeNull();
  });

  it("keeps a real standfirst after stripping the 'Contested: …' prefix", () => {
    const s = byIndex(2); // Rahul Gandhi — has a real sentence after the prefix
    const dek = cleanDek(s.dek, s.headline);
    expect(dek).toBeTruthy();
    expect(dek).not.toMatch(/^Contested:/i);
    expect(dek).toMatch(/Congress leader/i);
  });
});

describe("splitContext / hasContextBody", () => {
  const edition = loadFixture();
  const byIndex = (i: number) => edition.stories.find((s) => s.index === i)!;

  it("recognises a synthesized context as real body", () => {
    const s = byIndex(1); // cargo ship — full paragraph
    expect(hasContextBody(s.context)).toBe(true);
    expect(splitContext(s.context).provenance).toBeNull();
  });

  it("treats a boilerplate-only context as no body + captured provenance", () => {
    const s = byIndex(3); // stub
    const { body, provenance } = splitContext(s.context);
    expect(body).toBe("");
    expect(hasContextBody(s.context)).toBe(false);
    expect(provenance).toMatch(/reconstructed from/i);
  });
});

describe("storyLede", () => {
  const edition = loadFixture();
  const byIndex = (i: number) => edition.stories.find((s) => s.index === i)!;

  it("never returns the machine boilerplate", () => {
    for (const s of edition.stories) {
      expect(storyLede(s)).not.toMatch(/This story is reconstructed from/i);
    }
  });

  it("falls back to the first grounded claim for a report stub", () => {
    const s = byIndex(6); // Judges Bill — boilerplate context, real claims
    expect(storyLede(s)).toMatch(/Lok Sabha/i);
  });
});

describe("reconstructionNote", () => {
  const edition = loadFixture();
  const byIndex = (i: number) => edition.stories.find((s) => s.index === i)!;

  it("builds a clean, slug-free note from the cited outlets", () => {
    const note = reconstructionNote(byIndex(3));
    expect(note).toContain("Supreme Court");
    expect(note).not.toContain("_");
    expect(note).not.toMatch(/supreme_court/);
  });
});
