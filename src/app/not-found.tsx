import Link from "next/link";
import { Masthead } from "@/components/Masthead";

export default function NotFound() {
  return (
    <>
      <Masthead variant="slim" active={null} />
      <div className="mx-auto max-w-measure px-5 py-24 text-center">
        <span className="kicker text-sepia">Stop press</span>
        <h1
          className="mt-3 font-display font-black leading-none text-ink"
          style={{ fontSize: "clamp(3rem, 12vw, 6rem)" }}
        >
          404
        </h1>
        <p className="mx-auto mt-4 max-w-md font-display text-xl italic leading-snug text-sepia">
          This page has gone to press elsewhere. The edition you seek is not on
          the record.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <Link href="/" className="nav-link">
            Front Page
          </Link>
          <Link href="/archive" className="nav-link">
            Archive
          </Link>
        </div>
      </div>
    </>
  );
}
