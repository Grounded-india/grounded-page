import Link from "next/link";
import type { Edition, Story } from "@/lib/types";
import { ModeStamp } from "./ModeStamp";
import { SectionLabel } from "./SectionLabel";
import { Prose } from "./Prose";
import { DebateSpread } from "./DebateSpread";
import { ClaimList } from "./ClaimList";
import { CitedSources } from "./CitedSources";

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
}: {
  edition: Edition;
  story: Story;
  prev?: Story;
  next?: Story;
}) {
  return (
    <article className="mx-auto w-full max-w-[62rem] px-5 pb-10 pt-10 sm:px-8">
      {/* Kicker + provenance */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ModeStamp mode={story.mode} />
        <BadgeLine story={story} />
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

      {story.dek && (
        <p className="mt-4 max-w-[42rem] font-display text-xl italic leading-snug text-sepia sm:text-2xl">
          {story.dek}
        </p>
      )}

      <div className="mt-5 flex items-center gap-4">
        <hr className="rule-hair flex-1" />
        <Link
          href={`/edition/${edition.date}`}
          className="kicker text-sepia hover:text-oxblood"
        >
          {edition.humanDate}
        </Link>
        <hr className="rule-hair flex-1" />
      </div>

      {/* Context */}
      <section className="mt-8 max-w-[44rem]">
        <SectionLabel>Context</SectionLabel>
        <Prose markdown={story.context} dropCap />
      </section>

      {/* Debate OR What we know */}
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

      <div className="max-w-[46rem]">
        <CitedSources sources={story.sources} />
      </div>

      {/* Prev / next navigation */}
      <nav
        aria-label="Story navigation"
        className="mt-14 grid grid-cols-1 gap-4 border-t-2 border-ink/80 pt-6 sm:grid-cols-3 sm:items-start"
      >
        <div className="sm:justify-self-start">
          {prev ? (
            <Link
              href={`/story/${edition.date}/${prev.slug}`}
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
          <Link
            href={`/edition/${edition.date}`}
            className="nav-link"
          >
            Back to the edition
          </Link>
        </div>

        <div className="sm:justify-self-end sm:text-right">
          {next ? (
            <Link
              href={`/story/${edition.date}/${next.slug}`}
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
