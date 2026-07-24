import Link from "next/link";
import { getIssueNumber, getLatestEdition } from "@/lib/editions";
import { Masthead } from "@/components/Masthead";
import { FrontPage } from "@/components/FrontPage";

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
