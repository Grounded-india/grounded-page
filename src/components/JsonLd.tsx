/**
 * JSON-LD helpers for Google rich results.
 * Rendered as <script type="application/ld+json"> — never invents claims,
 * only restates structured page data.
 */
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

function abs(path: string): string {
  if (path.startsWith("http")) return path;
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}/${path.replace(/^\//, "").replace(/\/$/, "")}/`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    alternateName: ["GROUNDED", "Grounded Times", "Grounded India"],
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    foundingDate: "2026",
    areaServed: { "@type": "Country", name: "India" },
    knowsAbout: [
      "fact-checked journalism",
      "source citation",
      "Indian current affairs",
      "transparent AI news",
    ],
    sameAs: ["https://github.com/Grounded-india"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@type": "NewsMediaOrganization", name: SITE_NAME },
  };
}

export function newsArticleJsonLd(input: {
  headline: string;
  description: string;
  date: string;
  slug: string;
  mode: "report" | "debate";
  sources: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    datePublished: `${input.date}T00:00:00+05:30`,
    dateModified: `${input.date}T00:00:00+05:30`,
    mainEntityOfPage: abs(`/story/${input.date}/${input.slug}`),
    url: abs(`/story/${input.date}/${input.slug}`),
    isAccessibleForFree: true,
    inLanguage: "en-IN",
    articleSection: input.mode === "debate" ? "Debate" : "Report",
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    citation: input.sources.map((name) => ({
      "@type": "CreativeWork",
      name,
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
