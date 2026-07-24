import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllEditions, getStory } from "@/lib/editions";
import { Masthead } from "@/components/Masthead";
import { StoryArticle } from "@/components/StoryArticle";

export const dynamicParams = false;

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
  return {
    title: found.story.headline,
    description:
      found.story.dek ??
      `A ${found.story.mode} from the GROUNDED edition of ${found.edition.humanDate}.`,
  };
}

export default function StoryPage({
  params,
}: {
  params: { date: string; slug: string };
}) {
  const found = getStory(params.date, params.slug);
  if (!found) notFound();

  return (
    <>
      <Masthead variant="slim" active={null} />
      <StoryArticle
        edition={found.edition}
        story={found.story}
        prev={found.prev}
        next={found.next}
      />
    </>
  );
}
