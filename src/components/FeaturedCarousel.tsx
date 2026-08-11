"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RankedStory } from "@/lib/importance";
import { cleanDek, storyLede } from "@/lib/content";
import { DEFAULT_LANG, normalizeLang, storyPath } from "@/lib/i18n";
import { sourceCountLabel, t } from "@/lib/ui-i18n";
import { ModeStamp } from "./ModeStamp";
import { ImpactMeter } from "./ImpactMeter";
import { Prose } from "./Prose";
import { StoryFigure } from "./StoryFigure";

/**
 * How long each featured story holds before the page turns. Long enough to read
 * the headline, standfirst and opening paragraph without being rushed — readers
 * who want to linger further can stop the rotation with the ⏸ control.
 */
const INTERVAL_MS = 14000;

/**
 * The rotating "front-page banner". Cycles the edition's most important stories
 * (lead + features) with a gentle page-turn. When a story carries a photograph,
 * the cut sits beside the copy on a classic broadsheet spread — photo left,
 * type right — never overlaid.
 */
export function FeaturedCarousel({
  items,
  date,
  lang = DEFAULT_LANG,
}: {
  items: RankedStory[];
  date: string;
  lang?: string;
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
  const href = storyPath(date, story.slug, normalizeLang(lang));
  const rotating = count > 1;
  const dek = cleanDek(story.dek, story.headline);
  const lede = storyLede(story);
  const lead = story.images[0];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t(lang, "carousel.aria")}
      className="relative"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="kicker text-oxblood">
          {t(
            lang,
            active.tier === "lead" ? "carousel.lead" : "carousel.featured",
          )}
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

      <div className="relative mt-6 min-h-[22rem]">
        <AnimatePresence mode="wait">
          <motion.article
            key={story.slug}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className={lead ? "lead-spread" : undefined}
            data-has-photo={lead ? "true" : "false"}
          >
            {lead && (
              <div className="lead-photo">
                <StoryFigure image={lead} size="hero" priority showCaption />
              </div>
            )}

            <div className="lead-copy">
              <div
                aria-live="polite"
                className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <ModeStamp mode={story.mode} lang={lang} />
                <span className="kicker text-sepia">
                  {sourceCountLabel(lang, story.badges.sources)}
                  {story.badges.verified !== undefined && (
                    <> · {t(lang, "verified", { n: story.badges.verified })}</>
                  )}
                </span>
                <ImpactMeter
                  score={active.score}
                  lang={lang}
                  className="ml-auto"
                />
              </div>

              <Link href={href} className="group block">
                <h2
                  className="headline-shadow font-display font-black leading-[1.02] text-ink transition-opacity group-hover:opacity-80"
                  style={{
                    fontSize: lead
                      ? "clamp(1.85rem, 3.8vw, 3.1rem)"
                      : "clamp(2.1rem, 5.2vw, 3.9rem)",
                  }}
                >
                  {story.headline}
                </h2>
              </Link>

              {dek && (
                <p className="mt-4 max-w-3xl font-display text-lg italic leading-snug text-sepia sm:text-xl">
                  {dek}
                </p>
              )}

              {lede && (
                <div className="mt-5 max-w-3xl lead-lede">
                  <Prose markdown={lede} />
                </div>
              )}

              <Link
                href={href}
                className="ink-link mt-5 inline-block font-body text-sm font-semibold uppercase tracking-wide2 text-oxblood"
              >
                {t(lang, "carousel.continue")}
              </Link>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {rotating && (
        <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t(lang, "carousel.prev")}
              className="ctrl-btn"
            >
              ←
            </button>
            {!reduce && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={t(
                  lang,
                  paused ? "carousel.resume" : "carousel.pause",
                )}
                aria-pressed={paused}
                className="ctrl-btn !text-[0.65rem]"
              >
                {paused ? "▶" : "❚❚"}
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t(lang, "carousel.next")}
              className="ctrl-btn"
            >
              →
            </button>
          </div>

          <div
            role="tablist"
            aria-label={t(lang, "carousel.select")}
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
