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

function PulsingDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute h-2 w-2 rounded-full bg-violet-400"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `pulse-dot 2s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
        boxShadow: "0 0 12px rgba(139, 92, 246, 0.8)",
      }}
    />
  );
}

/** Hero Global Pulse — imagine statică default + puncte live pe orașe */
export default function WorldMapLive() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="relative mx-auto aspect-[2/1] max-w-2xl">
      <div className="world-map-live-glow h-full w-full">
        <div className="world-map-live-wrap h-full w-full">
          <img
            src="/global-pulse-world.png"
            alt="Hartă stilizată — puls global live"
            className="h-full w-full select-none object-cover"
            width={800}
            height={400}
            draggable={false}
          />
        </div>
      </div>
      {CITIES.map((city, i) => (
        <PulsingDot key={city.name} x={city.x} y={city.y} delay={i * 200} />
      ))}
    </div>
  );
}
