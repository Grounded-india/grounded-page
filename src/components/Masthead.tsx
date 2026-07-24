import Link from "next/link";

type NavKey = "front" | "archive" | "about" | null;

function MastheadNav({ active }: { active: NavKey }) {
  const items: { href: string; label: string; key: NavKey }[] = [
    { href: "/", label: "Front Page", key: "front" },
    { href: "/archive", label: "Archive", key: "archive" },
    { href: "/about", label: "Method", key: "about" },
  ];
  return (
    <nav
      aria-label="Sections"
      className="flex items-center justify-center gap-x-7 gap-y-2 py-2.5"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-link"
          data-active={active === item.key ? "true" : undefined}
          aria-current={active === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

interface MastheadProps {
  variant?: "full" | "slim";
  humanDate?: string;
  issueNumber?: number;
  active?: NavKey;
}

/**
 * The nameplate. `full` is the front-page/edition dressing (utility line,
 * dateline, motto); `slim` is a compact banner for interior pages.
 */
export function Masthead({
  variant = "full",
  humanDate,
  issueNumber,
  active = null,
}: MastheadProps) {
  const isFull = variant === "full";

  return (
    <header className="mx-auto w-full max-w-broadsheet px-5 pt-6 sm:px-8">
      <hr className="rule-hair" />

      {isFull && (
        <div className="flex items-center justify-between py-2 text-sepia">
          <span className="kicker !text-[0.6rem]">
            Vol. I{issueNumber ? ` · No. ${issueNumber}` : ""}
          </span>
          <span className="kicker !text-[0.6rem]">Est. MMXXVI</span>
        </div>
      )}

      <div className={isFull ? "pt-3 text-center" : "pt-4 text-center"}>
        <Link
          href="/"
          aria-label="The Grounded Times — front page"
          className="inline-block"
        >
          <span
            className="block font-body uppercase leading-none text-sepia"
            style={{
              fontSize: isFull ? "0.82rem" : "0.62rem",
              letterSpacing: "0.42em",
              paddingLeft: "0.42em",
              marginBottom: isFull ? "0.15rem" : "0.1rem",
            }}
          >
            The
          </span>
          <span
            className="block font-masthead leading-[0.9] text-ink"
            style={{
              fontSize: isFull
                ? "clamp(2.5rem, 9vw, 5.4rem)"
                : "clamp(1.85rem, 6vw, 2.9rem)",
              letterSpacing: "0.01em",
            }}
          >
            Grounded Times
          </span>
        </Link>
      </div>

      <hr className={isFull ? "rule-double mt-3" : "rule-double mt-2.5"} />

      {isFull ? (
        <>
          <div className="flex flex-col items-center gap-1 pt-3 text-center">
            <p className="kicker text-ink">
              {humanDate ? `${humanDate} · ` : ""}
              {issueNumber ? `No. ${issueNumber} · ` : ""}Fact-grounded ·
              Auditable
            </p>
            <p className="font-display text-[0.95rem] italic text-sepia">
              “Every claim, a citation.”
            </p>
          </div>
          <hr className="rule-hair mt-3" />
          <MastheadNav active={active} />
          <hr className="rule-thick" />
        </>
      ) : (
        <>
          <MastheadNav active={active} />
          <hr className="rule-hair" />
        </>
      )}
    </header>
  );
}
