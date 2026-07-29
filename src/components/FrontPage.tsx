import Link from "next/link";
import type { Edition } from "@/lib/types";
import { layoutEdition, type RankedStory } from "@/lib/importance";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { StoryTeaser, type TeaserVariant } from "./StoryTeaser";
import { BriefsList } from "./BriefsList";

/** How many of the top standard stories get the wide "second lead" treatment. */
const SECOND_LEADS = 2;

/** The ruled section header that opens everything below the hero. */
function DeckHeader({ count }: { count: number }) {
  return (
    <div className="deck-head">
      <h2 className="deck-title">In this edition</h2>
      <p className="deck-note">
        {count} more dispatch{count === 1 ? "" : "es"}
        <span className="deck-sep" aria-hidden="true">
          ·
        </span>
        ordered by importance
      </p>
    </div>
  );
}

/**
 * A run of teasers on the shared column grid. `cols` is the widest column count
 * the run may open up to on a large screen; narrower breakpoints step down on
 * their own (see `.edition-grid` / `.edition-deck` in globals.css).
 */
function TeaserGrid({
  items,
  date,
  cols,
  startOrdinal,
  variant = "standard",
}: {
  items: RankedStory[];
  date: string;
  cols: 2 | 3;
  startOrdinal: number;
  variant?: TeaserVariant;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={variant === "feature" ? "edition-deck" : "edition-grid"}
      data-cols={cols}
    >
      {items.map((r, i) => (
        <StoryTeaser
          key={r.story.slug}
          story={r.story}
          date={date}
          score={r.score}
          ordinal={startOrdinal + i}
          variant={variant}
        />
      ))}
    </div>
  );
}

/**
 * Renders an edition as an importance-driven broadsheet front page:
 *   1. a rotating hero of the most important stories (lead + features),
 *   2. two wide "second lead" teasers,
 *   3. a ruled column grid of the remaining stories, and
 *   4. an "In Brief" rail of the terse, single-source items.
 * Every placement is decided by lib/importance.ts — nothing is positioned by hand.
 * Used by `/` and `/edition/[date]`.
 */
export function FrontPage({ edition }: { edition: Edition }) {
  if (edition.stories.length === 0) {
    return (
      <div className="mx-auto max-w-measure px-5 py-16 text-center">
        <p className="font-display text-2xl italic text-sepia">
          No stories were grounded in this edition.
        </p>
        <Link
          href="/archive"
          className="ink-link mt-4 inline-block font-body text-xs uppercase tracking-wide2 text-oxblood"
        >
          Browse the back issues →
        </Link>
      </div>
    );
  }

  const { featured, standard, briefs } = layoutEdition(edition.stories);
  const remaining = standard.length + briefs.length;
  const hasBriefs = briefs.length > 0;

  // The hero already carries the top stories, so numbering picks up after them.
  const firstOrdinal = featured.length + 1;
  // The deck is a fixed pair, so it only opens when there are two to put in it.
  const hasDeck = standard.length >= SECOND_LEADS;
  const leads = hasDeck ? standard.slice(0, SECOND_LEADS) : [];
  const rest = hasDeck ? standard.slice(SECOND_LEADS) : standard;
  const restOrdinal = firstOrdinal + leads.length;

  // With a briefs rail taking a sidebar, the grid never widens past two columns.
  const gridCols = hasBriefs ? 2 : 3;

  const runs = (
    <>
      <TeaserGrid
        items={leads}
        date={edition.date}
        cols={gridCols}
        startOrdinal={firstOrdinal}
        variant="feature"
      />
      <TeaserGrid
        items={rest}
        date={edition.date}
        cols={gridCols}
        startOrdinal={restOrdinal}
      />
    </>
  );

  return (
    <div className="mx-auto w-full max-w-broadsheet px-5 pb-6 pt-8 sm:px-8">
      <FeaturedCarousel items={featured} date={edition.date} />

      {remaining > 0 && (
        <section aria-label="The rest of this edition">
          <hr className="rule-thick mt-10" />
          <DeckHeader count={remaining} />

          {hasBriefs ? (
            <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div>{runs}</div>
              <div className="briefs-rail">
                <BriefsList items={briefs} date={edition.date} />
              </div>
            </div>
          ) : (
            runs
          )}
        </section>
      )}
    </div>
  );
}
