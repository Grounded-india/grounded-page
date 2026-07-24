/**
 * GROUNDED — importance scoring & front-page layout tiers.
 *
 * The backend already emits stories in ranked order (story 1 = most important;
 * it deliberately downweights outrage/celebrity/virality). We treat that rank as
 * the DOMINANT signal and layer a transparent, auditable score on top of it so
 * the front page can position stories by importance and shape (lead / feature /
 * standard / brief) without a human touching the layout.
 *
 * How the score is built (0-100), highest weight first:
 *   1. Editorial rank .... where the backend placed the story (dominant, 40 pts)
 *   2. Source tier ....... primary/official > wire > social-aggregator (20/10/3)
 *   3. Grounding ......... report mode + primary-source-backed + verified claims
 *   4. Corroboration ..... how many DISTINCT outlets cite it
 *   5. Volume ............ how many source items were scraped (attention proxy)
 *   6. Substance ......... how many claims survived verification
 *   minus a small penalty for DEBATE (contested, no primary source).
 *
 * If the backend ever stamps an explicit "impact N" in the badge line, that value
 * is used verbatim and all of the above is skipped (see parser.ts / types.ts).
 *
 * Ideas for the backend to make this even sharper (documented for future work):
 *   - Emit an explicit 0-100 impact score per story in the badge line.
 *   - Tag a topic (policy / markets / world / sport / culture) so sport & culture
 *     can be down-weighted the way this heuristic can't fully infer.
 *   - Emit a recency/half-life so a running story decays over the day.
 */
import type { Story } from "./types";

export type LayoutTier = "lead" | "feature" | "standard" | "brief";
export type ImpactLabel = "High" | "Notable" | "Moderate" | "Routine";
type SourceTier = "primary" | "wire" | "social";

export interface RankedStory {
  story: Story;
  /** Composite 0-100 importance score. */
  score: number;
  /** Layout treatment on the front page. */
  tier: LayoutTier;
  /** Editorial reading of the score. */
  impact: ImpactLabel;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Courts, ministries, regulators, Parliament, official gazettes/portals.
const PRIMARY_RE =
  /(supreme court|high court|\bcourt\b|ministr|parliament|lok sabha|rajya sabha|cabinet|\bpib\b|press information bureau|\bprs\b|\brbi\b|\bsebi\b|gazette|government|\bgovt\b|sci\.gov|nic\.in|gov\.in)/i;
// Aggregators / social radar — topic signal only, never ground truth.
const SOCIAL_RE =
  /(google news|\breddit\b|twitter|\bx\.com\b|youtube|facebook|instagram|telegram|\bblog\b)/i;

/** Classify a single outlet name into a source tier. */
export function outletTier(name: string): SourceTier {
  if (PRIMARY_RE.test(name)) return "primary";
  if (SOCIAL_RE.test(name)) return "social";
  return "wire";
}

const TIER_RANK: Record<SourceTier, number> = { primary: 3, wire: 2, social: 1 };

/** The most authoritative source tier a story is grounded in. */
export function storySourceTier(story: Story): SourceTier {
  if (story.sources.length === 0) {
    return story.mode === "report" ? "primary" : "wire";
  }
  let best: SourceTier = "social";
  for (const outlet of story.sources) {
    const tier = outletTier(outlet);
    if (TIER_RANK[tier] > TIER_RANK[best]) best = tier;
  }
  return best;
}

const TIER_BONUS: Record<SourceTier, number> = { primary: 20, wire: 10, social: 3 };

/** A "brief" is a terse, single-source, single-claim item (a wire snippet or a
 *  raw official filing) — it belongs in an "In Brief" rail, not a headline slot. */
function isThin(story: Story): boolean {
  return story.badges.sources <= 1 && story.badges.claimsKept <= 1;
}

/** Composite 0-100 importance score for a single story. */
export function scoreStory(story: Story, total: number): number {
  if (typeof story.badges.impact === "number") {
    return clamp(story.badges.impact, 0, 100);
  }

  const n = Math.max(total, 1);
  const rankScore = ((n - story.index + 1) / n) * 40;
  const tierBonus = TIER_BONUS[storySourceTier(story)];

  const primaryBacked = story.claims.filter((c) => c.primarySourceBacked).length;
  const grounding =
    (story.mode === "report" ? 6 : 0) +
    Math.min(primaryBacked, 5) * 2 +
    Math.min(story.badges.verified ?? 0, 5);

  const corroboration = Math.min(story.sources.length, 6) * 2;
  const volume = Math.min(story.badges.sources, 12) * 0.6;
  const substance = Math.min(story.badges.claimsKept, 12) * 0.8;
  const debatePenalty = story.mode === "debate" ? 4 : 0;

  const raw =
    rankScore + tierBonus + grounding + corroboration + volume + substance - debatePenalty;
  return clamp(Math.round(raw), 0, 100);
}

export function impactLabel(score: number): ImpactLabel {
  if (score >= 62) return "High";
  if (score >= 44) return "Notable";
  if (score >= 28) return "Moderate";
  return "Routine";
}

/** 1-5 filled pips for the impact meter. */
export function impactPips(score: number): number {
  if (score >= 70) return 5;
  if (score >= 55) return 4;
  if (score >= 40) return 3;
  if (score >= 25) return 2;
  return 1;
}

const byScoreDesc = (a: RankedStory, b: RankedStory) =>
  b.score - a.score || a.story.index - b.story.index;

/**
 * Score every story and assign a layout tier:
 *   lead     — the single most important non-brief story (the hero)
 *   feature  — the next up-to-2 non-brief stories (rotate in the hero with lead)
 *   brief    — terse single-source/single-claim items (the "In Brief" rail)
 *   standard — everything else (the column grid)
 * Returns all stories, ordered by score (desc).
 */
export function rankStories(stories: Story[], maxFeatures = 2): RankedStory[] {
  const total = stories.length;

  const ranked: RankedStory[] = stories.map((story) => {
    const score = scoreStory(story, total);
    return { story, score, tier: "standard", impact: impactLabel(score) };
  });

  ranked.sort(byScoreDesc);

  const leadCandidate = ranked.find((r) => !isThin(r.story)) ?? ranked[0];
  let features = 0;

  for (const r of ranked) {
    if (r === leadCandidate) {
      r.tier = "lead";
    } else if (isThin(r.story)) {
      r.tier = "brief";
    } else if (features < maxFeatures) {
      r.tier = "feature";
      features += 1;
    } else {
      r.tier = "standard";
    }
  }

  return ranked;
}

export interface FrontPageLayout {
  /** Lead + features, in score order — the rotating hero. */
  featured: RankedStory[];
  /** Column-grid stories, in score order. */
  standard: RankedStory[];
  /** "In Brief" rail, in score order. */
  briefs: RankedStory[];
  /** All stories, score order (used for prev/next-safe listings). */
  ranked: RankedStory[];
}

/** Bucket an edition's stories into the front-page regions. */
export function layoutEdition(stories: Story[]): FrontPageLayout {
  const ranked = rankStories(stories);
  return {
    ranked,
    featured: ranked.filter((r) => r.tier === "lead" || r.tier === "feature"),
    standard: ranked.filter((r) => r.tier === "standard"),
    briefs: ranked.filter((r) => r.tier === "brief"),
  };
}
