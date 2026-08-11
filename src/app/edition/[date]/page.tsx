import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getEdition,
  getEditionDates,
  getIssueNumber,
  langSwitcherFor,
} from "@/lib/editions";
import { DEFAULT_LANG } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { Masthead } from "@/components/Masthead";
import { FrontPage } from "@/components/FrontPage";
import { HtmlLang } from "@/components/HtmlLang";

// In dev this lets a freshly-synced edition be viewed on-demand without a
// restart; the production static export still pre-renders the full set below.
export const dynamicParams = true;

export function generateStaticParams() {
  return getEditionDates().map((date) => ({ date }));
}

export function generateMetadata({
  params,
}: {
  params: { date: string };
}): Metadata {
  const edition = getEdition(params.date, DEFAULT_LANG);
  if (!edition) return { title: "Edition not found" };

  const tops = edition.stories
    .slice(0, 3)
    .map((s) => s.headline)
    .join(" · ");
  const description = `${SITE_NAME} edition for ${edition.humanDate} — ${edition.stories.length} fact-grounded, source-cited stories.${tops ? ` Lead: ${tops}.` : ""}`;
  const path = `/edition/${edition.date}/`;

  return {
    title: edition.humanDate,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${SITE_NAME} — ${edition.humanDate}`,
      description,
      url: path,
      publishedTime: `${edition.date}T00:00:00+05:30`,
      siteName: SITE_NAME,
    },
  };
}

export default function EditionPage({
  params,
}: {
  params: { date: string };
}) {
  const edition = getEdition(params.date, DEFAULT_LANG);
  if (!edition) notFound();

  const switcher = langSwitcherFor(edition.date, edition.lang);

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
        availableLangs={switcher.availableLangs}
        hrefByLang={switcher.hrefByLang}
      />
      <FrontPage edition={edition} />
    </>
  );
}
