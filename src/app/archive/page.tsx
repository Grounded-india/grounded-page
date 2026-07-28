import type { Metadata } from "next";
import Link from "next/link";
import type { EditionMeta } from "@/lib/types";
import { getEditionMetas } from "@/lib/editions";
import { Masthead } from "@/components/Masthead";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every back-issue of The Grounded Times, newest first. Each edition is a permanent, source-cited record of fact-grounded Indian news.",
  alternates: { canonical: "/archive/" },
  openGraph: {
    title: "Archive · The Grounded Times",
    description:
      "Browse every published edition — source-cited, auditable, permanent.",
    url: "/archive/",
  },
};

function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Group editions (already newest-first) into consecutive month buckets. */
function groupByMonth(editions: EditionMeta[]): { label: string; items: EditionMeta[] }[] {
  const groups: { label: string; items: EditionMeta[] }[] = [];
  for (const edition of editions) {
    const label = monthLabel(edition.id);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(edition);
    else groups.push({ label, items: [edition] });
  }
  return groups;
}

/** A single back-issue rendered as a miniature folded front page. */
function BackIssue({ edition }: { edition: EditionMeta }) {
  const more = edition.topHeadlines.slice(1);
  return (
    <Link href={`/edition/${edition.date}`} className="back-issue group">
      <div className="bi-plate">
        <span className="bi-the">The</span>
        <span className="bi-name">Grounded Times</span>
      </div>
      <hr className="bi-rule" />
      <div className="bi-meta">
        <span>No. {edition.issueNumber}</span>
        <span>{formatShort(edition.id)}</span>
      </div>

      <h3 className="bi-lead">{edition.leadHeadline}</h3>

      {more.length > 0 && (
        <ul className="bi-more">
          {more.map((headline) => (
            <li key={headline}>{headline}</li>
          ))}
        </ul>
      )}

      <div className="bi-foot">
        <span className="bi-stats">
          {edition.storyCount} stor{edition.storyCount === 1 ? "y" : "ies"}
          {edition.primaryCount > 0 && <> · {edition.primaryCount} primary</>}
        </span>
        <span className="bi-open">Open →</span>
      </div>
    </Link>
  );
}

export default function ArchivePage() {
  const editions = getEditionMetas();
  const groups = groupByMonth(editions);

  const totalStories = editions.reduce((n, e) => n + e.storyCount, 0);
  const totalPrimary = editions.reduce((n, e) => n + e.primaryCount, 0);

  return (
    <>
      <Masthead variant="slim" active="archive" />

      <div className="mx-auto w-full max-w-broadsheet px-5 pb-8 pt-10 sm:px-8">
        <div className="text-center">
          <span className="kicker text-sepia">The complete record</span>
          <h1
            className="mt-2 font-display font-black leading-none text-ink"
            style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)" }}
          >
            Back-Issues
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-display text-lg italic text-sepia">
            Every issue is permanent and every claim keeps its citation. Browse
            the rack below.
          </p>

          {editions.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              <span className="kicker text-ink">
                {editions.length} edition{editions.length === 1 ? "" : "s"}
              </span>
              <span className="kicker text-sepia-light">·</span>
              <span className="kicker text-ink">{totalStories} stories grounded</span>
              <span className="kicker text-sepia-light">·</span>
              <span className="kicker text-ink">{totalPrimary} primary-sourced</span>
            </div>
          )}
        </div>

        <hr className="rule-double mt-8" />

        {editions.length === 0 ? (
          <p className="py-16 text-center font-display text-xl italic text-sepia">
            No editions have been printed yet.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mt-10 first:mt-8">
              <div className="mb-5 flex items-center gap-4">
                <h2 className="kicker whitespace-nowrap !text-[0.72rem] text-ink">
                  {group.label}
                </h2>
                <hr className="rule-hair flex-1" />
                <span className="kicker !text-[0.6rem] text-sepia-light">
                  {group.items.length} issue{group.items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((edition) => (
                  <BackIssue key={edition.id} edition={edition} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
