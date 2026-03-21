"use client";

import { useState, useEffect } from "react";

const CITIES: { name: string; x: number; y: number }[] = [
  { name: "Jakarta", x: 72, y: 58 },
  { name: "Riyadh", x: 52, y: 42 },
  { name: "Manila", x: 78, y: 48 },
  { name: "Ho Chi Minh", x: 74, y: 52 },
  { name: "Cairo", x: 50, y: 42 },
  { name: "Dubai", x: 56, y: 40 },
  { name: "Singapore", x: 70, y: 55 },
  { name: "Kuala Lumpur", x: 68, y: 54 },
  { name: "Bangkok", x: 70, y: 48 },
  { name: "Mumbai", x: 62, y: 45 },
];

/** Mică constelație decorativă — puncte discrete, vibe romantic */
const STARS: { x: number; y: number; delay: number; s: number }[] = [
  { x: 12, y: 18, delay: 0, s: 0.85 },
  { x: 88, y: 22, delay: 400, s: 1 },
  { x: 25, y: 72, delay: 800, s: 0.7 },
  { x: 92, y: 68, delay: 200, s: 0.9 },
  { x: 8, y: 48, delay: 1200, s: 0.65 },
  { x: 48, y: 12, delay: 600, s: 0.75 },
  { x: 38, y: 88, delay: 900, s: 0.8 },
  { x: 65, y: 28, delay: 300, s: 0.7 },
  { x: 18, y: 35, delay: 1500, s: 0.6 },
  { x: 82, y: 82, delay: 500, s: 0.85 },
  { x: 55, y: 65, delay: 1100, s: 0.7 },
  { x: 42, y: 48, delay: 700, s: 0.55 },
];

function PulsingDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute rounded-full bg-fuchsia-300/90"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: "7px",
        height: "7px",
        marginLeft: "-3.5px",
        marginTop: "-3.5px",
        animation: `pulse-dot 2.4s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
        boxShadow:
          "0 0 10px rgba(244, 114, 182, 0.9), 0 0 22px rgba(168, 85, 247, 0.55), 0 0 36px rgba(139, 92, 246, 0.35)",
      }}
    />
  );
}

function MysticStar({ x, y, delay, s }: { x: number; y: number; delay: number; s: number }) {
  const px = Math.max(2, 3 * s);
  return (
    <span
      className="mystic-star"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: px,
        height: px,
        marginLeft: -px / 2,
        marginTop: -px / 2,
        animationDelay: `${delay}ms`,
      }}
      aria-hidden
    />
  );
}

/**
 * Hero „Live now” — fundal abstract mov animat (mister / romantism), fără imagine planetă.
 */
export default function WorldMapLive() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="relative mx-auto aspect-[2/1] max-w-2xl">
      <div className="world-map-live-glow h-full w-full">
        <div className="world-map-live-wrap mystic-canvas relative h-full w-full">
          <div className="mystic-mesh" aria-hidden />
          <div className="mystic-orb mystic-orb-a" aria-hidden />
          <div className="mystic-orb mystic-orb-b" aria-hidden />
          <div className="mystic-orb mystic-orb-c" aria-hidden />
          {STARS.map((star, i) => (
            <MysticStar key={i} x={star.x} y={star.y} delay={star.delay} s={star.s} />
          ))}
          <div className="mystic-veil" aria-hidden />
          <div className="mystic-vignette" aria-hidden />
        </div>
      </div>
      {CITIES.map((city, i) => (
        <PulsingDot key={city.name} x={city.x} y={city.y} delay={i * 200} />
      ))}
    </div>
  );
}
