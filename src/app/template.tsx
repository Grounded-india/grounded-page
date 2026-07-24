"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * A very restrained page-turn: a gentle ink-rise on navigation. Anything more
 * would break the print illusion. Disabled entirely for reduced-motion users.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
