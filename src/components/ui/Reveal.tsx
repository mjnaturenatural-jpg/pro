"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
}

/** Scroll-triggered reveal. Respects prefers-reduced-motion (opacity only). */
export function Reveal({ children, variants = fadeUp, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion();
  const safe: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
    : variants;

  return (
    <motion.div
      className={className}
      variants={safe}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-64px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
