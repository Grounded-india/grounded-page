import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  editionIdFromFilename,
  parseClaimLine,
  parseEdition,
  stripSourceSuffix,
} from "./parser";
import { storySlug } from "./slug";
import { humanizeInlineCitations, humanizeOutlet } from "./humanize";
import type { Edition } from "./types";

const FIXTURE_ID = "2026-07-21";
// Kept under src/lib/__fixtures__ so the live content/editions/ folder can drop
// old issues without breaking the golden parser suite.
const FIXTURE_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "__fixtures__",
  `edition-${FIXTURE_ID}.md`,
);

function loadFixture(): Edition {
  const md = fs.readFileSync(FIXTURE_PATH, "utf8");
  return parseEdition(md, FIXTURE_ID);
}

describe("parseEdition — golden fixture edition-2026-07-21.md", () => {
  const edition = loadFixture();

  it("reads the header dateline and story count", () => {
    expect(edition.id).toBe(FIXTURE_ID);
    expect(edition.date).toBe(FIXTURE_ID);
    expect(edition.humanDate).toBe("Tuesday, 21 July 2026");
    expect(edition.storyCount).toBe(7);
  });

  it("parses every story block (count matches the header)", () => {
    expect(edition.stories).toHaveLength(7);
    expect(edition.stories.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(edition.stories.length).toBe(edition.storyCount);
  });

  it("classifies modes from the badge line", () => {
    expect(edition.stories.map((s) => s.mode)).toEqual([
      "debate",
      "debate",
      "report",
      "debate",
      "report",
      "report",
      "debate",
    ]);
  });

  it("parses badge integers, including report-only 'verified'", () => {
    const s1 = edition.stories[0];
    expect(s1.badges).toEqual({ sources: 6, claimsKept: 6 });
    expect(s1.badges.verified).toBeUndefined();

    const s6 = edition.stories[5]; // report
    expect(s6.badges).toEqual({ sources: 1, claimsKept: 3, verified: 3 });
  });

  it("captures the dek and context", () => {
    const s1 = edition.stories[0];
    expect(s1.dek).toMatch(/^Contested: 3 outlet\(s\), no primary source\./);
    expect(s1.context).toContain("MV Golden Leo");
    expect(s1.context.length).toBeGreaterThan(100);
  });

  describe("debate story with an EMPTY Side B (story 1)", () => {
    const story = edition.stories[0];

    it("is a debate parsed into ordered turns", () => {
      expect(story.mode).toBe("debate");
      expect(story.debate).toBeDefined();
      expect(story.debate!.turns).toHaveLength(2);
    });

    it("keeps Side A as the first turn (side 0) with a body", () => {
      const a = story.debate!.turns[0];
      expect(a.side).toBe(0);
      expect(a.speaker).toBe("Supporters' account");
      expect(a.body.length).toBeGreaterThan(50);
    });

    it("keeps Side B as an empty second turn (degrades gracefully)", () => {
      const b = story.debate!.turns[1];
      expect(b.side).toBe(1);
      expect(b.speaker).toBe("Skeptics' account");
      expect(b.body).toBe("");
    });
  });

  describe("debate story with a populated Side B (story 4)", () => {
    const story = edition.stories[3];

    it("parses both side turns", () => {
      const [a, b] = story.debate!.turns;
      expect(a.speaker).toBe("What is being reported");
      expect(a.side).toBe(0);
      expect(b.speaker).toBe("Why it remains unverified");
      expect(b.side).toBe(1);
      expect(b.body).toContain("No primary or official source");
    });

    it("humanizes inline citations in the debate body", () => {
      expect(story.debate!.turns[0].body).toContain("(Reuters India)");
      expect(story.debate!.turns[0].body).not.toContain("(reuters_india)");
    });

    it("keeps an embedded em-dash inside a claim's text", () => {
      const claim = story.claims.find((c) => c.text.includes("NEW YORK (AP)"));
      expect(claim).toBeDefined();
      expect(claim!.text).toContain("— U.S.");
      expect(claim!.outlets).toEqual(["AP India"]);
    });
  });

  describe("report story (story 6) with primary-source-backed claims", () => {
    const story = edition.stories[5];

    it("uses 'What we know' claims and has no debate or report body", () => {
      expect(story.mode).toBe("report");
      expect(story.debate).toBeUndefined();
      expect(story.report).toBeUndefined();
      expect(story.claims).toHaveLength(3);
    });

    it("detects primary-source backing on every claim", () => {
      expect(story.claims.every((c) => c.primarySourceBacked)).toBe(true);
      expect(story.claims[0].outlets).toEqual(["PRS India"]);
    });
  });

  it("detects a NON-primary claim with multiple outlets (story 1)", () => {
    const claim = edition.stories[0].claims[0];
    expect(claim.text).toContain("Four Indian nationals were killed");
    expect(claim.primarySourceBacked).toBe(false);
    expect(claim.outlets).toEqual([
      "Google News India",
      "Indian Express",
      "Reuters India",
    ]);
  });

  it("parses the per-story cited sources list", () => {
    expect(edition.stories[0].sources).toEqual([
      "Google News India",
      "Indian Express",
      "Reuters India",
    ]);
    expect(edition.stories[2].sources).toEqual(["Supreme Court"]);
    expect(edition.stories[6].sources).toEqual([
      "Indian Express",
      "Reuters India",
      "The Hindu",
    ]);
  });

  describe("headline display vs. anchor slug", () => {
    it("strips the scrape suffix for display but keeps raw for the slug", () => {
      const s3 = edition.stories[2];
      expect(s3.rawHeadline).toContain(" - api.sci.gov.in");
      expect(s3.headline).not.toContain("api.sci.gov.in");
      expect(s3.headline).toContain("CHIEF JUSTICE DAI");
    });

    it("produces slugs that match the backend TOC anchors", () => {
      expect(edition.stories[2].slug).toBe(
        "3-supreme-court-of-india-list-of-curative-review-petitions-by-circulation-in-the-chambers-of-honble-the-chief-justice-dai-apiscigovin",
      );
      expect(edition.stories[0].slug).toBe(
        "1-four-indian-nationals-killed-in-attack-on-cargo-ship-off-ukraine-coast",
      );
    });
  });
});

describe("parseEdition — live new-format editions in content/", () => {
  function load(id: string) {
    const md = fs.readFileSync(
      path.join(process.cwd(), "content", "editions", `edition-${id}.md`),
      "utf8",
    );
    return parseEdition(md, id);
  }

  it("parses every committed edition without dropping stories", () => {
    const dir = path.join(process.cwd(), "content", "editions");
    const files = fs
      .readdirSync(dir)
      .filter((f) => /^edition-\d{4}-\d{2}-\d{2}\.md$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const id = editionIdFromFilename(file)!;
      const edition = load(id);
      expect(edition.stories.length).toBeGreaterThan(0);
      expect(edition.storyCount).toBe(edition.stories.length);
      expect(edition.humanDate.length).toBeGreaterThan(0);
    }
  });

  it("captures ### Report bodies and does not bleed Sources into them", () => {
    const edition = load("2026-07-27");
    const report = edition.stories.find((s) => s.mode === "report" && s.report);
    expect(report).toBeDefined();
    expect(report!.report!.length).toBeGreaterThan(200);
    expect(report!.report).not.toContain("**Sources:**");
    expect(report!.report).not.toContain("Public discussion");
  });

  it("parses multi-turn debates with rebuttals/closings and a bottom line", () => {
    const edition = load("2026-07-23");
    const debateStory = edition.stories.find((s) => s.mode === "debate" && s.debate);
    expect(debateStory).toBeDefined();
    const d = debateStory!.debate!;
    expect(d.turns.length).toBeGreaterThanOrEqual(2);
    expect(new Set(d.turns.map((t) => t.side)).size).toBeGreaterThanOrEqual(1);
    expect(d.bottomLine).toBeDefined();
    expect(d.bottomLine!.length).toBeGreaterThan(40);
  });

  it("reads underscore-italic deks (backend underscore style)", () => {
    const edition = load("2026-07-23");
    const withDek = edition.stories.find((s) => s.dek);
    expect(withDek).toBeDefined();
    expect(withDek!.dek!.length).toBeGreaterThan(10);
  });

  // Asserted structurally rather than against one hardcoded headline, so the
  // test survives an edition's content being republished.
  it("slugifies every headline to match its TOC anchor", () => {
    const edition = load("2026-07-27");
    expect(edition.stories.length).toBeGreaterThan(0);
    for (const s of edition.stories) {
      expect(s.slug).toBe(storySlug(s.index, s.rawHeadline));
      expect(s.slug).toMatch(/^\d+-[a-z0-9-]+$/);
    }
  });
});

describe("unit helpers", () => {
  it("editionIdFromFilename extracts the date or returns null", () => {
    expect(editionIdFromFilename("edition-2026-07-21.md")).toBe("2026-07-21");
    expect(editionIdFromFilename("notes.md")).toBeNull();
  });

  it("stripSourceSuffix only removes known trailing source tags", () => {
    expect(stripSourceSuffix("Cabinet approves MPMS - PIB")).toBe(
      "Cabinet approves MPMS",
    );
    expect(stripSourceSuffix("A - B custody battle")).toBe(
      "A - B custody battle",
    );
  });

  it("storySlug mirrors the anchor algorithm", () => {
    expect(storySlug(2, "Rahul Gandhi labels Narendra Modi 'most anti-youth' prime minister")).toBe(
      "2-rahul-gandhi-labels-narendra-modi-most-anti-youth-prime-minister",
    );
  });

  it("parseClaimLine handles primary vs non-primary", () => {
    const primary = parseClaimLine(
      "- It amends the Supreme Court Act, 1956. — *PRS India* _(primary-source backed)_",
    );
    expect(primary).toEqual({
      text: "It amends the Supreme Court Act, 1956.",
      outlets: ["PRS India"],
      primarySourceBacked: true,
    });

    const plain = parseClaimLine("- Some claim. — *The Hindu, Reuters India*");
    expect(plain?.primarySourceBacked).toBe(false);
    expect(plain?.outlets).toEqual(["The Hindu", "Reuters India"]);

    expect(parseClaimLine("Not a claim line")).toBeNull();
  });

  it("humanizeOutlet maps known slugs and title-cases unknowns", () => {
    expect(humanizeOutlet("the_hindu")).toBe("The Hindu");
    expect(humanizeOutlet("google_news_india")).toBe("Google News India");
    expect(humanizeOutlet("some_new_wire")).toBe("Some New Wire");
  });

  it("humanizeInlineCitations leaves ordinary parentheticals alone", () => {
    const input = "Prices rose (ap_india) sharply NEW YORK (AP) again.";
    const out = humanizeInlineCitations(input);
    expect(out).toContain("(AP India)");
    expect(out).toContain("(AP)"); // untouched
  });

  it("humanizes the new reddit_news and hyphenated pib-response slugs", () => {
    expect(humanizeOutlet("reddit_news")).toBe("Reddit News");
    expect(humanizeOutlet("pib-response")).toBe("PIB");
    expect(humanizeInlineCitations("assured relief (pib-response) today")).toContain(
      "(PIB)",
    );
  });
});
