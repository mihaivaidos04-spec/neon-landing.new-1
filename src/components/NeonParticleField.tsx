"use client";

import { useEffect, useState } from "react";

const PARTICLES = 24;
const COLORS = [
  "rgba(139, 92, 246, 0.15)",
  "rgba(139, 92, 246, 0.08)",
  "rgba(57, 255, 20, 0.1)",
  "rgba(168, 85, 247, 0.06)",
];

function Particle({ i }: { i: number }) {
  const size = 2 + (i % 4);
  const color = COLORS[i % COLORS.length];
  const left = (i * 17 + 13) % 100;
  const top = (i * 23 + 7) % 100;
  const duration = 18 + (i % 12);
  const delay = -(i * 2.3) % 20;

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        top: `${top}%`,
        background: color,
        boxShadow: `0 0 ${size * 4}px ${color}`,
        animation: `particle-float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function NeonParticleField() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {Array.from({ length: PARTICLES }, (_, i) => (
        <Particle key={i} i={i} />
      ))}
    </div>
  );
}
