"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactionId } from "../lib/reactions";

type Props = {
  reaction: ReactionId | null;
  onComplete: () => void;
};

const EMOJI_MAP: Record<ReactionId, string> = {
  heart: "❤️",
  fire: "🔥",
  laugh: "😂",
  love: "😍",
  wow: "😮",
};

function Particle({ emoji, delay }: { emoji: string; delay: number }) {
  const x = (Math.random() - 0.5) * 200;
  const y = (Math.random() - 0.5) * 200;
  const scale = 0.5 + Math.random() * 1.5;
  const duration = 1.5 + Math.random() * 1;

  return (
    <motion.div
      className="pointer-events-none absolute text-4xl sm:text-5xl"
      initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, scale, scale * 0.5],
        x: [`50%`, `calc(50% + ${x}px)`, `calc(50% + ${x * 1.5}px)`],
        y: [`50%`, `calc(50% + ${y}px)`, `calc(50% + ${y * 1.5}px)`],
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    >
      {emoji}
    </motion.div>
  );
}

export default function ReactionOverlay({ reaction, onComplete }: Props) {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (!reaction) return;
    const emoji = EMOJI_MAP[reaction];
    const count = 24;
    setParticles(Array.from({ length: count }, (_, i) => i));
    const t = setTimeout(onComplete, 3000);
    return () => clearTimeout(t);
  }, [reaction, onComplete]);

  if (!reaction) return null;

  const emoji = EMOJI_MAP[reaction];

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex h-full w-full items-center justify-center">
          {particles.map((i) => (
            <Particle key={i} emoji={emoji} delay={i * 0.03} />
          ))}
          <motion.div
            className="absolute text-6xl sm:text-8xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {emoji}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
