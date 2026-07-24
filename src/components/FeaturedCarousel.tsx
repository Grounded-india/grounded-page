"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RankedStory } from "@/lib/importance";
import { cleanDek, storyLede } from "@/lib/content";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";
import { Prose } from "./Prose";

/** How long each featured story holds before the page turns. */
const INTERVAL_MS = 6500;

/**
 * The rotating "front-page banner". It cycles the edition's MOST IMPORTANT
 * stories (lead + features, chosen by lib/importance.ts) with a gentle
 * page-turn, the way a broadsheet's showcase might refresh. Pauses on
 * hover/focus, is fully keyboard-operable, and holds still for reduced-motion
 * readers (who still get every control).
 */
export function FeaturedCarousel({
  items,
  date,
}: {
  items: RankedStory[];
  date: string;
}) {
  const reduce = useReducedMotion();
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (reduce || paused || count <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [reduce, paused, count]);

  if (count === 0) return null;

  const active = items[Math.min(index, count - 1)];
  const story = active.story;
  const href = `/story/${date}/${story.slug}`;
  const rotating = count > 1;
  const dek = cleanDek(story.dek, story.headline);
  const lede = storyLede(story);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured dispatches"
      className="relative"
      // Note: we deliberately do NOT pause on mouse hover — the hero covers the
      // whole top of the page, so hover-pausing made the progress bar freeze
      // "randomly" whenever the cursor rested there. Keyboard focus still pauses
      // (so controls don't shift under a tabbing user), and the ⏸ button is the
      // explicit stop mechanism.
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="kicker text-oxblood">
          {active.tier === "lead" ? "The lead" : "Featured"} — by importance
        </span>
        {rotating && (
          <span className="kicker tabular-nums text-sepia-light">
            {index + 1} / {count}
          </span>
        )}
      </div>

      {rotating && !reduce && (
        <div className="featured-progress mt-2" aria-hidden="true">
          <span
            key={index}
            style={{
              animationDuration: `${INTERVAL_MS}ms`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}

      <div className="relative mt-6 min-h-[23rem] sm:min-h-[20rem]">
        <AnimatePresence mode="wait">
          <motion.article
            key={story.slug}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div
              aria-live="polite"
              className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <ModeStamp mode={story.mode} />
              <span className="kicker text-sepia">
                {story.badges.sources} source
                {story.badges.sources === 1 ? "" : "s"}
                {story.badges.verified !== undefined && (
                  <> · {story.badges.verified} verified</>
                )}
              </span>
              <ImpactMeter score={active.score} className="ml-auto" />
            </div>

            <Link href={href} className="group block">
              <h2
                className="headline-shadow font-display font-black leading-[1.02] text-ink transition-opacity group-hover:opacity-80"
                style={{ fontSize: "clamp(2.1rem, 5.2vw, 3.9rem)" }}
              >
                {story.headline}
              </h2>
            </Link>

            {dek && (
              <p className="mt-4 max-w-3xl font-display text-xl italic leading-snug text-sepia">
                {dek}
              </p>
            )}

            {lede && (
              <div className="mt-5 max-w-3xl">
                <Prose markdown={lede} />
              </div>
            )}

            <Link
              href={href}
              className="ink-link mt-5 inline-block font-body text-sm font-semibold uppercase tracking-wide2 text-oxblood"
            >
              Continue reading →
            </Link>
          </motion.article>
        </AnimatePresence>
      </div>

      {rotating && (
        <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous featured story"
              className="ctrl-btn"
            >
              ←
            </button>
            {!reduce && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={
                  paused ? "Resume auto-rotation" : "Pause auto-rotation"
                }
                aria-pressed={paused}
                className="ctrl-btn !text-[0.65rem]"
              >
                {paused ? "▶" : "❚❚"}
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next featured story"
              className="ctrl-btn"
            >
              →
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Select a featured story"
            className="flex items-center gap-2"
          >
            {items.map((r, i) => (
              <button
                key={r.story.slug}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Feature ${i + 1}: ${r.story.headline}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                  i === index
                    ? "border-oxblood bg-oxblood"
                    : "border-ink/40 bg-transparent hover:bg-ink/20"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
