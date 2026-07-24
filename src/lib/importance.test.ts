import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseEdition } from "./parser";
import {
  layoutEdition,
  outletTier,
  rankStories,
  scoreStory,
  storySourceTier,
} from "./importance";
import type { Edition, Story } from "./types";

const FIXTURE_ID = "2026-07-21";
const FIXTURE_PATH = path.join(
  process.cwd(),
  "content",
  "editions",
  `edition-${FIXTURE_ID}.md`,
);

function loadFixture(): Edition {
  return parseEdition(fs.readFileSync(FIXTURE_PATH, "utf8"), FIXTURE_ID);
}

describe("outletTier", () => {
  it("classifies primary/official sources", () => {
    expect(outletTier("Supreme Court")).toBe("primary");
    expect(outletTier("PIB")).toBe("primary");
    expect(outletTier("PRS India")).toBe("primary");
    expect(outletTier("Ministry of External Affairs")).toBe("primary");
  });

  it("classifies wire agencies", () => {
    expect(outletTier("Reuters India")).toBe("wire");
    expect(outletTier("AP India")).toBe("wire");
    expect(outletTier("The Hindu")).toBe("wire");
    expect(outletTier("Indian Express")).toBe("wire");
  });

  it("classifies aggregators/social as the lowest tier", () => {
    expect(outletTier("Google News India")).toBe("social");
    expect(outletTier("Reddit")).toBe("social");
  });
});

describe("scoreStory", () => {
  const edition = loadFixture();

  it("always returns a 0-100 integer", () => {
    for (const story of edition.stories) {
      const s = scoreStory(story, edition.stories.length);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
      expect(Number.isInteger(s)).toBe(true);
    }
  });

  it("uses an explicit backend impact score verbatim when present", () => {
    const base = edition.stories[0];
    const stamped: Story = { ...base, badges: { ...base.badges, impact: 91 } };
    expect(scoreStory(stamped, edition.stories.length)).toBe(91);
  });

  it("clamps an out-of-range explicit score", () => {
    const base = edition.stories[0];
    const stamped: Story = { ...base, badges: { ...base.badges, impact: 250 } };
    expect(scoreStory(stamped, edition.stories.length)).toBe(100);
  });

  it("ranks the backend's #1 story above the last", () => {
    const first = scoreStory(edition.stories[0], edition.stories.length);
    const last = scoreStory(edition.stories[6], edition.stories.length);
    expect(first).toBeGreaterThan(last);
  });
});

describe("storySourceTier", () => {
  const edition = loadFixture();

  it("reads the best tier from a story's cited outlets", () => {
    // Story 6 is grounded in PRS India (a primary/official source).
    const bill = edition.stories.find((s) => s.index === 6)!;
    expect(storySourceTier(bill)).toBe("primary");
  });
});

describe("layoutEdition — golden fixture", () => {
  const edition = loadFixture();
  const layout = layoutEdition(edition.stories);

  it("elects a single non-thin lead", () => {
    const leads = layout.ranked.filter((r) => r.tier === "lead");
    expect(leads).toHaveLength(1);
    // The cargo-ship deaths (backend rank 1) is the most important story.
    expect(leads[0].story.index).toBe(1);
  });

  it("files the terse single-source filings as briefs", () => {
    const briefIdx = layout.briefs.map((r) => r.story.index).sort();
    expect(briefIdx).toEqual([3, 5]);
  });

  it("rotates the lead plus up to two features in the hero", () => {
    expect(layout.featured.length).toBeGreaterThanOrEqual(1);
    expect(layout.featured.length).toBeLessThanOrEqual(3);
    for (const r of layout.featured) {
      expect(["lead", "feature"]).toContain(r.tier);
    }
  });

  it("partitions every story exactly once across the three regions", () => {
    const seen = [
      ...layout.featured,
      ...layout.standard,
      ...layout.briefs,
    ].map((r) => r.story.index);
    expect(seen).toHaveLength(edition.stories.length);
    expect(new Set(seen).size).toBe(edition.stories.length);
  });

  it("orders each region by descending score", () => {
    const scores = layout.ranked.map((r) => r.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });
});

describe("rankStories — degenerate editions", () => {
  it("still elects a lead when every story is a thin brief", () => {
    const edition = loadFixture();
    const onlyThin = edition.stories.filter(
      (s) => s.badges.sources <= 1 && s.badges.claimsKept <= 1,
    );
    const ranked = rankStories(onlyThin);
    expect(ranked.filter((r) => r.tier === "lead")).toHaveLength(1);
  });
});
