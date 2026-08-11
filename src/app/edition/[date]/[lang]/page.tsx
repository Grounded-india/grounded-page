import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getEdition,
  getEditionDates,
  getIssueNumber,
  discoverLangs,
} from "@/lib/editions";
import { DEFAULT_LANG, isLang, LANG_META, type Lang } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { Masthead } from "@/components/Masthead";
import { FrontPage } from "@/components/FrontPage";
import { HtmlLang } from "@/components/HtmlLang";

export const dynamicParams = true;

export function generateStaticParams() {
  return getEditionDates().flatMap((date) =>
    discoverLangs(date)
      .filter((lang) => lang !== DEFAULT_LANG)
      .map((lang) => ({ date, lang })),
  );
}

export function generateMetadata({
  params,
}: {
  params: { date: string; lang: string };
}): Metadata {
  if (!isLang(params.lang) || params.lang === DEFAULT_LANG) {
    return { title: "Edition not found" };
  }
  const edition = getEdition(params.date, params.lang);
  if (!edition) return { title: "Edition not found" };

  const tops = edition.stories
    .slice(0, 3)
    .map((s) => s.headline)
    .join(" · ");
  const description = `${SITE_NAME} edition for ${edition.humanDate} — ${edition.stories.length} fact-grounded, source-cited stories.${tops ? ` Lead: ${tops}.` : ""}`;
  const path = `/edition/${edition.date}/${params.lang}/`;

  return {
    title: `${edition.humanDate} · ${LANG_META[params.lang as Lang].englishName}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${SITE_NAME} — ${edition.humanDate}`,
      description,
      url: path,
      publishedTime: `${edition.date}T00:00:00+05:30`,
      siteName: SITE_NAME,
      locale: LANG_META[params.lang as Lang].htmlLang.replace("-", "_"),
    },
  };
}

export default function TranslatedEditionPage({
  params,
}: {
  params: { date: string; lang: string };
}) {
  if (!isLang(params.lang) || params.lang === DEFAULT_LANG) notFound();

  const edition = getEdition(params.date, params.lang);
  if (!edition) notFound();

  return (
    <>
      <HtmlLang lang={edition.lang} />
      <Masthead
        variant="full"
        humanDate={edition.humanDate}
        issueNumber={getIssueNumber(edition.id)}
        active={null}
        date={edition.date}
        lang={edition.lang}
        availableLangs={edition.availableLangs}
      />
      <FrontPage edition={edition} />
    </>
  );
}
