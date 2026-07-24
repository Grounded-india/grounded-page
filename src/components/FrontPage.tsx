import type { Edition } from "@/lib/types";
import { layoutEdition } from "@/lib/importance";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { StoryTeaser } from "./StoryTeaser";
import { BriefsList } from "./BriefsList";
import { SectionLabel } from "./SectionLabel";

/**
 * Renders an edition as an importance-driven broadsheet front page:
 *   1. a rotating hero of the most important stories (lead + features),
 *   2. a column grid of the standard stories, and
 *   3. an "In Brief" rail of the terse, single-source items.
 * All three regions are decided by lib/importance.ts — no manual placement.
 * Used by `/` and `/edition/[date]`.
 */
export function FrontPage({ edition }: { edition: Edition }) {
  if (edition.stories.length === 0) {
    return (
      <div className="mx-auto max-w-measure px-5 py-16 text-center">
        <p className="font-display text-2xl italic text-sepia">
          No stories were grounded in this edition.
        </p>
      </div>
    );
  }

  const { featured, standard, briefs } = layoutEdition(edition.stories);
  const hasStandard = standard.length > 0;
  const hasBriefs = briefs.length > 0;
  const inGrid = standard.length + briefs.length;

  return (
    <div className="mx-auto w-full max-w-broadsheet px-5 pb-6 pt-8 sm:px-8">
      <FeaturedCarousel items={featured} date={edition.date} />

      {(hasStandard || hasBriefs) && (
        <>
          <hr className="rule-thick mt-10" />
          <div className="mb-2 mt-4 flex items-baseline justify-between">
            <SectionLabel className="!mb-0">In this edition</SectionLabel>
            <span className="kicker text-sepia-light">
              {inGrid} more stor{inGrid === 1 ? "y" : "ies"}
            </span>
          </div>

          {hasStandard && hasBriefs ? (
            <div className="grid grid-cols-1 gap-x-8 pt-2 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="cols-2">
                {standard.map((r) => (
                  <StoryTeaser
                    key={r.story.slug}
                    story={r.story}
                    date={edition.date}
                    score={r.score}
                  />
                ))}
              </div>
              <div className="briefs-rail">
                <BriefsList items={briefs} date={edition.date} />
              </div>
            </div>
          ) : hasStandard ? (
            <div className="broadsheet-cols pt-2">
              {standard.map((r) => (
                <StoryTeaser
                  key={r.story.slug}
                  story={r.story}
                  date={edition.date}
                  score={r.score}
                />
              ))}
            </div>
          ) : (
            <div className="pt-2">
              <BriefsList items={briefs} date={edition.date} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
