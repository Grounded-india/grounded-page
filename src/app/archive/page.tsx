import type { Metadata } from "next";
import Link from "next/link";
import { getEditionMetas } from "@/lib/editions";
import { Masthead } from "@/components/Masthead";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every back-issue of GROUNDED, newest first. Each edition is a permanent, source-cited record.",
};

export default function ArchivePage() {
  const editions = getEditionMetas();

  return (
    <>
      <Masthead variant="slim" active="archive" />

      <div className="mx-auto w-full max-w-broadsheet px-5 pb-6 pt-10 sm:px-8">
        <div className="text-center">
          <span className="kicker text-sepia">The complete record</span>
          <h1
            className="mt-2 font-display font-black leading-none text-ink"
            style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)" }}
          >
            Back-Issues
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-display text-lg italic text-sepia">
            {editions.length} edition{editions.length === 1 ? "" : "s"} on the
            record. Every issue is permanent and every claim keeps its citation.
          </p>
        </div>

        <hr className="rule-double mt-8" />

        {editions.length === 0 ? (
          <p className="py-16 text-center font-display text-xl italic text-sepia">
            No editions have been printed yet.
          </p>
        ) : (
          <ul>
            {editions.map((edition) => (
              <li key={edition.id}>
                <Link
                  href={`/edition/${edition.date}`}
                  className="group grid grid-cols-1 gap-x-8 gap-y-2 border-b border-ink/15 py-7 sm:grid-cols-[16rem_1fr]"
                >
                  <div>
                    <div className="kicker text-sepia-light">
                      No. {edition.issueNumber}
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold leading-tight text-ink group-hover:text-oxblood">
                      {edition.humanDate}
                    </div>
                    <div className="mt-2 kicker text-sepia">
                      {edition.storyCount} stor
                      {edition.storyCount === 1 ? "y" : "ies"}
                      {edition.debateCount > 0 && (
                        <> · {edition.debateCount} debate</>
                      )}
                      {edition.reportCount > 0 && (
                        <> · {edition.reportCount} report</>
                      )}
                    </div>
                  </div>

                  <div className="sm:pt-1">
                    <span className="kicker text-sepia-light">Leading with</span>
                    <p className="mt-1 max-w-2xl font-display text-lg italic leading-snug text-ink/90">
                      {edition.leadHeadline}
                    </p>
                    <span className="ink-link mt-3 inline-block font-body text-xs uppercase tracking-wide2 text-oxblood">
                      Open this edition →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
