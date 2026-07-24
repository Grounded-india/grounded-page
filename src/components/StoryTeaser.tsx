import Link from "next/link";
import type { Story } from "@/lib/types";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";
import { Prose } from "./Prose";

function firstParagraph(markdown: string): string {
  return markdown.split(/\n{2,}/).map((p) => p.trim()).find(Boolean) ?? "";
}

function MetaLine({ story }: { story: Story }) {
  return (
    <span className="kicker text-sepia">
      {story.badges.sources} source{story.badges.sources === 1 ? "" : "s"}
      {story.badges.verified !== undefined && (
        <> · {story.badges.verified} verified</>
      )}
    </span>
  );
}

/** The lead — largest headline, drop-capped opening paragraph. */
export function LeadStory({ story, date }: { story: Story; date: string }) {
  const href = `/story/${date}/${story.slug}`;
  return (
    <article className="pb-8">
      <div className="mb-4 flex items-center gap-4">
        <ModeStamp mode={story.mode} />
        <MetaLine story={story} />
      </div>

      <Link href={href} className="group block">
        <h2
          className="headline-shadow font-display font-black leading-[1.02] text-ink transition-opacity group-hover:opacity-80"
          style={{ fontSize: "clamp(2.1rem, 5.2vw, 3.9rem)" }}
        >
          {story.headline}
        </h2>
      </Link>

      {story.dek && (
        <p className="mt-4 max-w-3xl font-display text-xl italic leading-snug text-sepia">
          {story.dek}
        </p>
      )}

      <div className="mt-5 gap-x-10 sm:columns-2">
        <Prose markdown={firstParagraph(story.context)} dropCap />
      </div>

      <Link
        href={href}
        className="ink-link mt-5 inline-block font-body text-sm font-semibold uppercase tracking-wide2 text-oxblood"
      >
        Continue reading →
      </Link>
    </article>
  );
}

/** A compact column teaser for the broadsheet grid. */
export function StoryTeaser({
  story,
  date,
  score,
}: {
  story: Story;
  date: string;
  score?: number;
}) {
  const href = `/story/${date}/${story.slug}`;
  return (
    <article className="mb-8 break-inside-avoid pt-6">
      <hr className="rule-hair-soft mb-4" />
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <ModeStamp mode={story.mode} />
        {score !== undefined && <ImpactMeter score={score} showLabel={false} />}
      </div>

      <Link href={href} className="group block">
        <h3 className="font-display text-[1.45rem] font-bold leading-[1.12] text-ink transition-opacity group-hover:opacity-80">
          {story.headline}
        </h3>
      </Link>

      {story.dek && (
        <p className="mt-2 font-body text-[0.95rem] italic leading-snug text-sepia">
          {story.dek}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <MetaLine story={story} />
        <Link href={href} className="ink-link font-body text-xs uppercase tracking-wide2 text-oxblood">
          Read →
        </Link>
      </div>
    </article>
  );
}
