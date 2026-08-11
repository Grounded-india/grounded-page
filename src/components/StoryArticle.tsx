import Link from "next/link";
import type { Edition, Story } from "@/lib/types";
import { cleanDek, hasContextBody, reconstructionNote, splitContext } from "@/lib/content";
import { editionPath, storyPath } from "@/lib/i18n";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";
import { SectionLabel } from "./SectionLabel";
import { Prose } from "./Prose";
import { DebateSpread } from "./DebateSpread";
import { ClaimList } from "./ClaimList";
import { CitedSources } from "./CitedSources";
import { StoryFigure } from "./StoryFigure";

function BadgeLine({ story }: { story: Story }) {
  const parts: string[] = [
    `${story.badges.sources} source${story.badges.sources === 1 ? "" : "s"}`,
    `${story.badges.claimsKept} claim${story.badges.claimsKept === 1 ? "" : "s"} kept`,
  ];
  if (story.badges.verified !== undefined) {
    parts.push(`${story.badges.verified} verified`);
  }
  return <span className="kicker text-sepia">{parts.join("  ·  ")}</span>;
}

export function StoryArticle({
  edition,
  story,
  prev,
  next,
  score,
}: {
  edition: Edition;
  story: Story;
  prev?: Story;
  next?: Story;
  score?: number;
}) {
  const dek = cleanDek(story.dek, story.headline);
  const { body } = splitContext(story.context);
  const [lead, ...gallery] = story.images;
  const lang = edition.lang;
  const editionHref = editionPath(edition.date, lang);

  return (
    <article className="mx-auto w-full max-w-[62rem] px-5 pb-10 pt-10 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ModeStamp mode={story.mode} />
        <BadgeLine story={story} />
        {score !== undefined && <ImpactMeter score={score} />}
        <span className="kicker ml-auto text-sepia-light">
          No. {story.index} of {edition.stories.length}
        </span>
      </div>

      <h1
        className="headline-shadow mt-5 max-w-[52rem] font-display font-black leading-[1.03] text-ink"
        style={{ fontSize: "clamp(2rem, 4.6vw, 3.4rem)" }}
      >
        {story.headline}
      </h1>

      {dek && (
        <p className="mt-4 max-w-[42rem] font-display text-xl italic leading-snug text-sepia sm:text-2xl">
          {dek}
        </p>
      )}

      {lead && (
        <div className="mt-7 max-w-[52rem]">
          <StoryFigure image={lead} size="hero" priority />
        </div>
      )}

      <div className="mt-5 flex items-center gap-4">
        <hr className="rule-hair flex-1" />
        <Link
          href={editionHref}
          className="kicker text-sepia hover:text-oxblood"
        >
          {edition.humanDate}
        </Link>
        <hr className="rule-hair flex-1" />
      </div>

      {hasContextBody(story.context) ? (
        <section className="mt-8 max-w-[44rem]">
          <SectionLabel>Context</SectionLabel>
          <Prose markdown={body} dropCap={!story.report} />
        </section>
      ) : story.report ? null : (
        <p className="provenance-note mt-8 max-w-[44rem]">
          {reconstructionNote(story)}
        </p>
      )}

      {story.report && (
        <section className="mt-10 max-w-[44rem]">
          <SectionLabel>Report</SectionLabel>
          <Prose markdown={story.report} dropCap />
        </section>
      )}

      {story.mode === "debate" && story.debate ? (
        <section className="mt-12">
          <SectionLabel>The debate</SectionLabel>
          <DebateSpread debate={story.debate} />
        </section>
      ) : null}

      {story.claims.length > 0 && (
        <section className="mt-12 max-w-[46rem]">
          <SectionLabel>
            {story.mode === "debate" ? "Grounded points" : "What we know"}
          </SectionLabel>
          <ClaimList claims={story.claims} />
        </section>
      )}

      {gallery.length > 0 && (
        <section className="mt-12 max-w-[52rem]" aria-label="Photographs">
          <SectionLabel>Photographs</SectionLabel>
          <div className="photo-gallery">
            {gallery.map((image) => (
              <StoryFigure key={image.src} image={image} size="inline" />
            ))}
          </div>
        </section>
      )}

      <div className="max-w-[46rem]">
        <CitedSources sources={story.sources} />
      </div>

      <nav
        aria-label="Story navigation"
        className="mt-14 grid grid-cols-1 gap-4 border-t-2 border-ink/80 pt-6 sm:grid-cols-3 sm:items-start"
      >
        <div className="sm:justify-self-start">
          {prev ? (
            <Link
              href={storyPath(edition.date, prev.slug, lang)}
              className="group block max-w-xs"
            >
              <span className="kicker text-sepia-light">← Previous</span>
              <span className="mt-1 block font-display text-base leading-snug text-ink group-hover:text-oxblood">
                {prev.headline}
              </span>
            </Link>
          ) : (
            <span className="kicker text-sepia-light/60">← Previous</span>
          )}
        </div>

        <div className="text-center sm:justify-self-center">
          <Link href={editionHref} className="nav-link">
            Back to the edition
          </Link>
        </div>

        <div className="sm:justify-self-end sm:text-right">
          {next ? (
            <Link
              href={storyPath(edition.date, next.slug, lang)}
              className="group block max-w-xs sm:ml-auto"
            >
              <span className="kicker text-sepia-light">Next →</span>
              <span className="mt-1 block font-display text-base leading-snug text-ink group-hover:text-oxblood">
                {next.headline}
              </span>
            </Link>
          ) : (
            <span className="kicker text-sepia-light/60">Next →</span>
          )}
        </div>
      </nav>
    </article>
  );
}
