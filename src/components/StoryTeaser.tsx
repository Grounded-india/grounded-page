import Link from "next/link";
import type { Story } from "@/lib/types";
import { teaserBlurb } from "@/lib/content";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";

export type TeaserVariant = "feature" | "standard";

/** Named outlets when the story cites any, otherwise the counted badge. */
function sourceLine(story: Story): string {
  if (story.sources.length > 0) return story.sources.join(" · ");
  const n = story.badges.sources;
  return `${n} source${n === 1 ? "" : "s"}`;
}

/**
 * A front-page teaser card. Two treatments, one component:
 *   feature  — the secondary leads sitting directly under the hero
 *   standard — the column grid below them
 * The headline link is stretched over the whole card in CSS, so the card is one
 * hit area and one tab stop — a reader doesn't traverse a duplicate "Read"
 * link for every story on the page.
 */
export function StoryTeaser({
  story,
  date,
  score,
  ordinal,
  variant = "standard",
}: {
  story: Story;
  date: string;
  score?: number;
  ordinal?: number;
  variant?: TeaserVariant;
}) {
  const href = `/story/${date}/${story.slug}`;
  const blurb = teaserBlurb(story);
  const sources = sourceLine(story);

  return (
    <article className="teaser" data-variant={variant}>
      <div className="teaser-top">
        {ordinal !== undefined && (
          <span className="teaser-no" aria-hidden="true">
            {String(ordinal).padStart(2, "0")}
          </span>
        )}
        <ModeStamp mode={story.mode} />
        {score !== undefined && (
          <ImpactMeter score={score} showLabel={false} className="ml-auto" />
        )}
      </div>

      <h3 className="teaser-headline">
        <Link href={href} className="teaser-link">
          {story.headline}
        </Link>
      </h3>

      {blurb && <p className="teaser-dek">{blurb}</p>}

      <div className="teaser-foot">
        <span className="teaser-sources">{sources}</span>
        <span className="teaser-read" aria-hidden="true">
          Read <span className="teaser-arrow">→</span>
        </span>
      </div>
    </article>
  );
}
