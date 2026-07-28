import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllEditions, getStory } from "@/lib/editions";
import { cleanDek, storyLede } from "@/lib/content";
import { scoreStory } from "@/lib/importance";
import { SITE_NAME } from "@/lib/site";
import { Masthead } from "@/components/Masthead";
import { StoryArticle } from "@/components/StoryArticle";
import { JsonLd, newsArticleJsonLd } from "@/components/JsonLd";

// In dev this lets a freshly-synced edition's stories render on-demand without a
// restart; the production static export still pre-renders the full set below.
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllEditions().flatMap((edition) =>
    edition.stories.map((story) => ({
      date: edition.date,
      slug: story.slug,
    })),
  );
}

export function generateMetadata({
  params,
}: {
  params: { date: string; slug: string };
}): Metadata {
  const found = getStory(params.date, params.slug);
  if (!found) return { title: "Story not found" };

  const { story, edition } = found;
  const description =
    cleanDek(story.dek, story.headline) ??
    storyLede(story) ??
    `A ${story.mode} from ${SITE_NAME}, ${edition.humanDate}. Source-cited and auditable.`;

  const path = `/story/${edition.date}/${story.slug}/`;

  return {
    title: story.headline,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: story.headline,
      description,
      url: path,
      publishedTime: `${edition.date}T00:00:00+05:30`,
      modifiedTime: `${edition.date}T00:00:00+05:30`,
      section: story.mode === "debate" ? "Debate" : "Report",
      tags: [story.mode, "India", "fact-grounded", ...story.sources.slice(0, 4)],
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: story.headline,
      description,
    },
    other: {
      "article:published_time": `${edition.date}T00:00:00+05:30`,
      "article:section": story.mode === "debate" ? "Debate" : "Report",
    },
  };
}

export default function StoryPage({
  params,
}: {
  params: { date: string; slug: string };
}) {
  const found = getStory(params.date, params.slug);
  if (!found) notFound();

  const score = scoreStory(found.story, found.edition.stories.length);
  const description =
    cleanDek(found.story.dek, found.story.headline) ??
    storyLede(found.story) ??
    found.story.headline;

  return (
    <>
      <JsonLd
        data={newsArticleJsonLd({
          headline: found.story.headline,
          description,
          date: found.edition.date,
          slug: found.story.slug,
          mode: found.story.mode,
          sources: found.story.sources,
        })}
      />
      <Masthead variant="slim" active={null} />
      <StoryArticle
        edition={found.edition}
        story={found.story}
        prev={found.prev}
        next={found.next}
        score={score}
      />
    </>
  );
}
