import type { Metadata } from "next";
import Link from "next/link";
import { getIssueNumber, getLatestEdition } from "@/lib/editions";
import { storyLede } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { Masthead } from "@/components/Masthead";
import { FrontPage } from "@/components/FrontPage";

export function generateMetadata(): Metadata {
  const edition = getLatestEdition();
  if (!edition) {
    return {
      title: {
        absolute: `${SITE_NAME} — The Fact-Grounded Daily for India`,
      },
    };
  }

  const top = edition.stories.slice(0, 3).map((s) => s.headline);
  const description = [
    `${SITE_NAME} · ${edition.humanDate}.`,
    `${edition.stories.length} fact-grounded stories.`,
    top.length ? `Today: ${top.join(" · ")}.` : "",
    SITE_TAGLINE,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: {
      absolute: `${SITE_NAME} — ${edition.humanDate}`,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: `${SITE_NAME} — ${edition.humanDate}`,
      description:
        top[0] ??
        storyLede(edition.stories[0]) ??
        `${edition.stories.length} source-cited stories.`,
      url: "/",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — fact-grounded daily for India`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${edition.humanDate}`,
      description,
      images: ["/og.png"],
    },
  };
}

export default function HomePage() {
  const edition = getLatestEdition();

  if (!edition) {
    return (
      <>
        <Masthead variant="full" active="front" />
        <div className="mx-auto max-w-measure px-5 py-24 text-center">
          <p className="font-display text-2xl italic leading-relaxed text-sepia">
            The press is warm but no edition has been set. Drop an{" "}
            <code className="not-italic">edition-YYYY-MM-DD.md</code> into{" "}
            <code className="not-italic">content/editions/</code> and rebuild.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Masthead
        variant="full"
        humanDate={edition.humanDate}
        issueNumber={getIssueNumber(edition.id)}
        active="front"
      />
      <FrontPage edition={edition} />
      <div className="mx-auto w-full max-w-broadsheet px-5 pb-4 text-center sm:px-8">
        <Link href="/archive" className="nav-link">
          Read the back-issues →
        </Link>
      </div>
    </>
  );
}
