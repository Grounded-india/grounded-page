import Link from "next/link";
import type { Edition } from "@/lib/types";
import { layoutEdition, type RankedStory } from "@/lib/importance";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { StoryTeaser } from "./StoryTeaser";
import { BriefsList } from "./BriefsList";

/** How many of the top standard stories get the wide "second lead" treatment. */
const SECOND_LEADS = 2;
/** How many mid-page photo bands to cut across the page. */
const PHOTO_BANDS = 2;

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

function PhotoGrid({
  items,
  date,
  startOrdinal,
}: {
  items: RankedStory[];
  date: string;
  startOrdinal: number;
}) {
  if (items.length === 0) return null;
  return (
    <div className="photo-grid">
      {items.map((r, i) => (
        <StoryTeaser
          key={r.story.slug}
          story={r.story}
          date={date}
          score={r.score}
          ordinal={startOrdinal + i}
          variant="standard"
        />
      ))}
    </div>
  );
}

/**
 * Renders an edition as a photo-led broadsheet front page:
 *   1. a rotating hero of the most important stories (with lead photograph),
 *   2. two wide second-lead photo features,
 *   3. alternating mid-page photo bands for the next few stories,
 *   4. a two-column photo grid for the rest, and
 *   5. an "In Brief" rail of the terse, single-source items.
 * Every placement is decided by lib/importance.ts — nothing is positioned by hand.
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

  const firstOrdinal = featured.length + 1;
  const hasDeck = standard.length >= SECOND_LEADS;
  const leads = hasDeck ? standard.slice(0, SECOND_LEADS) : [];

  // Prefer photo-bearing stories for the mid-page bands so the layout earns its
  // visual rhythm; fall back to whatever remains if few photographs landed.
  const afterLeads = hasDeck ? standard.slice(SECOND_LEADS) : standard;
  const withPhoto = afterLeads.filter((r) => r.story.images.length > 0);
  const withoutPhoto = afterLeads.filter((r) => r.story.images.length === 0);
  const bands = withPhoto.slice(0, PHOTO_BANDS);
  const bandSlugs = new Set(bands.map((r) => r.story.slug));
  const rest = [
    ...withPhoto.filter((r) => !bandSlugs.has(r.story.slug)),
    ...withoutPhoto,
  ];

  const bandOrdinal = firstOrdinal + leads.length;
  const restOrdinal = bandOrdinal + bands.length;

  const main = (
    <>
      {leads.length > 0 && (
        <div className="second-leads">
          {leads.map((r, i) => (
            <StoryTeaser
              key={r.story.slug}
              story={r.story}
              date={edition.date}
              score={r.score}
              ordinal={firstOrdinal + i}
              variant="feature"
            />
          ))}
        </div>
      )}

      {bands.map((r, i) => (
        <div key={r.story.slug} className="photo-band-wrap">
          <StoryTeaser
            story={r.story}
            date={edition.date}
            score={r.score}
            ordinal={bandOrdinal + i}
            variant="band"
            bandFlip={i % 2 === 1}
          />
        </div>
      ))}

      <PhotoGrid items={rest} date={edition.date} startOrdinal={restOrdinal} />
    </>
  );

  return (
    <div className="mx-auto w-full max-w-broadsheet px-5 pb-6 pt-8 sm:px-8">
      <FeaturedCarousel items={featured} date={edition.date} />

      {remaining > 0 && (
        <section aria-label="The rest of this edition" className="edition-body">
          <hr className="rule-thick mt-10" />
          <DeckHeader count={remaining} />

          {hasBriefs ? (
            <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div>{main}</div>
              <div className="briefs-rail">
                <BriefsList items={briefs} date={edition.date} />
              </div>
            </div>
          ) : (
            main
          )}
        </section>
      )}
    </div>
  );
}
