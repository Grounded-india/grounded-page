import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  discoverLangs,
  getEdition,
  getEditionDates,
  getStory,
  getStoryByIndex,
} from "@/lib/editions";
import { cleanDek, storyLede } from "@/lib/content";
import { scoreStory } from "@/lib/importance";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { Masthead } from "@/components/Masthead";
import { StoryArticle } from "@/components/StoryArticle";
import { JsonLd, newsArticleJsonLd } from "@/components/JsonLd";
import { HtmlLang } from "@/components/HtmlLang";

export const dynamicParams = true;

export function generateStaticParams() {
  return getEditionDates().flatMap((date) =>
    discoverLangs(date)
      .filter((lang) => lang !== DEFAULT_LANG)
      .flatMap((lang) => {
        const edition = getEdition(date, lang);
        if (!edition) return [];
        return edition.stories.map((story) => ({
          date,
          lang,
          slug: story.slug,
        }));
      }),
  );
}

export function generateMetadata({
  params,
}: {
  params: { date: string; lang: string; slug: string };
}): Metadata {
  if (!isLang(params.lang) || params.lang === DEFAULT_LANG) {
    return { title: "Story not found" };
  }
  const found = getStory(params.date, params.slug, params.lang);
  if (!found) return { title: "Story not found" };

  const { story, edition } = found;
  const description =
    cleanDek(story.dek, story.headline) ??
    storyLede(story) ??
    `A ${story.mode} from ${SITE_NAME}, ${edition.humanDate}. Source-cited and auditable.`;

  const path = `/l/${params.lang}/story/${edition.date}/${story.slug}/`;

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
      siteName: SITE_NAME,
    },
  };
}

export default function TranslatedStoryPage({
  params,
}: {
  params: { date: string; lang: string; slug: string };
}) {
  if (!isLang(params.lang) || params.lang === DEFAULT_LANG) notFound();

  const found = getStory(params.date, params.slug, params.lang);
  if (!found) notFound();

  const score = scoreStory(found.story, found.edition.stories.length);
  const description =
    cleanDek(found.story.dek, found.story.headline) ??
    storyLede(found.story) ??
    found.story.headline;

  const storySlugsByLang: Partial<Record<Lang, string>> = {};
  for (const lang of found.edition.availableLangs) {
    const s = getStoryByIndex(found.edition.date, found.story.index, lang);
    if (s) storySlugsByLang[lang] = s.slug;
  }

  return (
    <>
      <HtmlLang lang={found.edition.lang} />
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
      <Masthead
        variant="slim"
        active={null}
        date={found.edition.date}
        lang={found.edition.lang}
        availableLangs={found.edition.availableLangs}
        storyIndex={found.story.index}
        storySlugsByLang={storySlugsByLang}
      />
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
