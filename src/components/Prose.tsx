"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the inline Markdown inside a prose field (bold, italics, links,
 * lists). react-markdown is used ONLY for this — never to structure the page.
 * Remote images are neutralised to their alt text so nothing off-paper loads.
 */
const components: Components = {
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  img: ({ alt }) => (alt ? <span className="italic text-sepia">{alt}</span> : null),
};

export function Prose({
  markdown,
  className = "",
  dropCap = false,
}: {
  markdown: string;
  className?: string;
  dropCap?: boolean;
}) {
  if (!markdown?.trim()) return null;
  return (
    <div className={`prose-paper ${dropCap ? "drop-cap" : ""} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
