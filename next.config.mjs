/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pure static export: the reader-facing site ships as plain HTML/CSS/JS with
  // no server runtime. This structurally guarantees the frontend makes ZERO
  // backend/API/DB calls — every byte is derived from the edition Markdown at
  // build time.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  eslint: {
    // Editorial copy carries a lot of apostrophes/quotes; keep linting available
    // via `npm run lint` but never let it block a content rebuild.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
