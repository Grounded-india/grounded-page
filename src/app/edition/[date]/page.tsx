import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getEdition,
  getEditionDates,
  getIssueNumber,
} from "@/lib/editions";
import { Masthead } from "@/components/Masthead";
import { FrontPage } from "@/components/FrontPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return getEditionDates().map((date) => ({ date }));
}

export function generateMetadata({
  params,
}: {
  params: { date: string };
}): Metadata {
  const edition = getEdition(params.date);
  if (!edition) return { title: "Edition not found" };
  return {
    title: `${edition.humanDate}`,
    description: `The GROUNDED edition for ${edition.humanDate} — ${edition.stories.length} fact-grounded stories.`,
  };
}

export default function EditionPage({
  params,
}: {
  params: { date: string };
}) {
  const edition = getEdition(params.date);
  if (!edition) notFound();

  return (
    <>
      <Masthead
        variant="full"
        humanDate={edition.humanDate}
        issueNumber={getIssueNumber(edition.id)}
        active={null}
      />
      <FrontPage edition={edition} />
    </>
  );
}
