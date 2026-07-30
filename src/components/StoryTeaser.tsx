import Link from "next/link";
import type { Story } from "@/lib/types";
import { teaserBlurb } from "@/lib/content";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";
import { StoryFigure } from "./StoryFigure";

export type TeaserVariant = "feature" | "standard" | "band";

/** Named outlets when the story cites any, otherwise the counted badge. */
function sourceLine(story: Story): string {
  if (story.sources.length > 0) return story.sources.join(" · ");
  const n = story.badges.sources;
  return `${n} source${n === 1 ? "" : "s"}`;
}

/**
 * A front-page teaser. Three treatments, one component:
 *   feature  — wide second-lead with a large photograph on top
 *   standard — photo cut above the headline in the column grid
 *   band     — landscape photo left, copy right (alternating mid-page features)
 * The headline link is stretched over the whole card in CSS so the card is one
 * hit area and one tab stop.
 */
export function StoryTeaser({
  story,
  date,
  score,
  ordinal,
  variant = "standard",
  bandFlip = false,
}: {
  story: Story;
  date: string;
  score?: number;
  ordinal?: number;
  variant?: TeaserVariant;
  /** For `band` variant: put the photo on the right. */
  bandFlip?: boolean;
}) {
  const href = `/story/${date}/${story.slug}`;
  const blurb = teaserBlurb(story);
  const sources = sourceLine(story);
  const lead = story.images[0];
  const hasPhoto = Boolean(lead);

  return (
    <article
      className="teaser"
      data-variant={variant}
      data-has-photo={hasPhoto ? "true" : "false"}
      data-flip={bandFlip ? "true" : undefined}
    >
      {lead && (
        <div className="teaser-media" aria-hidden={variant === "band" ? undefined : true}>
          <StoryFigure
            image={lead}
            size={variant === "feature" || variant === "band" ? "feature" : "card"}
            showCaption={false}
            priority={variant === "feature"}
          />
        </div>
      )}

      <div className="teaser-copy">
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
      </div>
    </article>
  );
}
