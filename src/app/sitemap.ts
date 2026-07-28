import type { MetadataRoute } from "next";
import { getAllEditions } from "@/lib/editions";
import { SITE_URL } from "@/lib/site";

/** Absolute URL helper that respects trailingSlash: true. */
function url(path = ""): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  return `${SITE_URL}/${clean}/`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const editions = getAllEditions();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: url("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: url("/archive"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: url("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const editionRoutes: MetadataRoute.Sitemap = editions.map((edition) => ({
    url: url(`/edition/${edition.date}`),
    lastModified: new Date(`${edition.date}T12:00:00.000Z`),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const storyRoutes: MetadataRoute.Sitemap = editions.flatMap((edition) =>
    edition.stories.map((story) => ({
      url: url(`/story/${edition.date}/${story.slug}`),
      lastModified: new Date(`${edition.date}T12:00:00.000Z`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [...staticRoutes, ...editionRoutes, ...storyRoutes];
}
