import Link from "next/link";
import type { RankedStory } from "@/lib/importance";

/**
 * The "In Brief" rail — terse, single-source items (raw official filings, lone
 * wire snippets) collected as a scannable column instead of full teasers. This
 * is where the importance engine files its lowest-weight, thinnest stories.
 */
export function BriefsList({
  items,
  date,
  heading = "In Brief",
}: {
  items: RankedStory[];
  date: string;
  heading?: string;
}) {
  if (items.length === 0) return null;

  return (
    <aside aria-label="News in brief" className="briefs">
      <h3 className="briefs-title">{heading}</h3>
      <ul>
        {items.map(({ story }) => (
          <li key={story.slug} className="brief-item">
            <Link href={`/story/${date}/${story.slug}`} className="group block">
              <span className="brief-mode" data-mode={story.mode}>
                {story.mode === "report" ? "Report" : "Debate"}
              </span>
              <span className="brief-headline group-hover:text-oxblood">
                {story.headline}
              </span>
              <span className="brief-meta">
                {story.sources.length > 0
                  ? story.sources.join(" · ")
                  : `${story.badges.sources} source${
                      story.badges.sources === 1 ? "" : "s"
                    }`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
