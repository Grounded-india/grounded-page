import type { Edition } from "@/lib/types";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { StoryTeaser } from "./StoryTeaser";
import { SectionLabel } from "./SectionLabel";

/**
 * Renders an edition as a broadsheet front page: an auto-rotating featured
 * banner up top, then the full edition flowing through ruled newspaper columns.
 * Used by `/` and `/edition/[date]`.
 */
export function FrontPage({ edition }: { edition: Edition }) {
  const stories = edition.stories;

  if (stories.length === 0) {
    return (
      <div className="mx-auto max-w-measure px-5 py-16 text-center">
        <p className="font-display text-2xl italic text-sepia">
          No stories were grounded in this edition.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-broadsheet px-5 pb-6 pt-8 sm:px-8">
      <FeaturedCarousel stories={stories} date={edition.date} />

      <hr className="rule-thick mt-10" />
      <div className="mb-2 mt-4 flex items-baseline justify-between">
        <SectionLabel className="!mb-0">In this edition</SectionLabel>
        <span className="kicker text-sepia-light">
          {stories.length} stor{stories.length === 1 ? "y" : "ies"}
        </span>
      </div>

      <div className="broadsheet-cols pt-2">
        {stories.map((story) => (
          <StoryTeaser key={story.slug} story={story} date={edition.date} />
        ))}
      </div>
    </div>
  );
}
