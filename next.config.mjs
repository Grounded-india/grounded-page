/**
 * Phase-aware config. Next calls this with the current phase string; during
 * `next build` that value is "phase-production-build" (the value of Next's
 * PHASE_PRODUCTION_BUILD constant), during `next dev` it is
 * "phase-development-server".
 *
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default function nextConfig(phase) {
  // `output: "export"` is applied ONLY for the production build (`next build`).
  // The shipped site is then plain HTML/CSS/JS with no server runtime, which
  // structurally guarantees the frontend makes ZERO backend/API/DB calls —
  // every byte is derived from the edition Markdown at build time.
  //
  // We intentionally do NOT set it during `next dev`: export mode makes the dev
  // server reject dynamic routes (e.g. /story/[date]/[slug]) even when
  // generateStaticParams is present. Leaving it off in dev lets those routes
  // render normally while the static export behaviour is unchanged at build.
  const isStaticExport = phase === "phase-production-build";

  return {
    ...(isStaticExport ? { output: "export" } : {}),
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    reactStrictMode: true,
    eslint: {
      // Editorial copy carries a lot of apostrophes/quotes; keep linting
      // available via `npm run lint` but never let it block a content rebuild.
      ignoreDuringBuilds: true,
    },
  };
}
