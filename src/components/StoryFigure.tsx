import type { StoryImage } from "@/lib/types";

export type CutSize = "hero" | "feature" | "card" | "inline";

/**
 * A newspaper photograph cut — image + optional caption/credit. No cards,
 * no rounded corners, no shadows: just ink on paper with a hairline rule.
 */
export function StoryFigure({
  image,
  size = "card",
  priority = false,
  className = "",
  showCaption = true,
}: {
  image: StoryImage;
  size?: CutSize;
  priority?: boolean;
  className?: string;
  /** Front-page cards often skip the caption to keep the cut tight. */
  showCaption?: boolean;
}) {
  const caption = image.caption?.trim();
  const credit = image.credit?.trim();
  const creditHref = image.creditUrl?.trim();
  const captionVisible = showCaption && Boolean(caption || credit);

  return (
    <figure className={`photo-cut photo-cut-${size} ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt || ""}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        width={1600}
        height={900}
      />
      {captionVisible && (
        <figcaption className="photo-caption">
          {caption && <span className="photo-caption-text">{caption}</span>}
          {credit && (
            <>
              {caption ? " " : null}
              <span className="photo-credit">
                {creditHref ? (
                  <a href={creditHref} target="_blank" rel="noopener noreferrer">
                    Photo via {credit}
                  </a>
                ) : (
                  <>Photo via {credit}</>
                )}
              </span>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
