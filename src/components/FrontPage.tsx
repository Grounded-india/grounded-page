import type { Edition } from "@/lib/types";
import { LeadStory, StoryTeaser } from "./StoryTeaser";

/**
 * Renders an edition as a broadsheet front page: a lead story with a
 * drop-capped opening, then the remaining stories flowing through ruled
 * newspaper columns. Used by `/` and `/edition/[date]`.
 */
export function FrontPage({ edition }: { edition: Edition }) {
  const [lead, ...rest] = edition.stories;

  if (!lead) {
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
      <LeadStory story={lead} date={edition.date} />

      {rest.length > 0 && (
        <>
          <hr className="rule-thick" />
          <div className="broadsheet-cols pt-2">
            {rest.map((story) => (
              <StoryTeaser key={story.slug} story={story} date={edition.date} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
