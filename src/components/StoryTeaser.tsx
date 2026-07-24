import Link from "next/link";
import type { Story } from "@/lib/types";
import { cleanDek } from "@/lib/content";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";

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
  const dek = cleanDek(story.dek, story.headline);
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

      {dek && (
        <p className="mt-2 font-body text-[0.95rem] italic leading-snug text-sepia">
          {dek}
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
