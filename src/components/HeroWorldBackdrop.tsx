"use client";

/**
 * Subtle equirectangular-style world context: faint continents + graticule + neon city markers.
 * Coordinates: viewBox 0 0 360 180 → x = lon + 180, y = 90 − lat
 */

const VIEW_W = 360;
const VIEW_H = 180;

type City = { name: string; lon: number; lat: number };

export const HERO_WORLD_CITIES: City[] = [
  { name: "New York", lon: -74.006, lat: 40.7128 },
  { name: "Tokyo", lon: 139.6917, lat: 35.6895 },
  { name: "London", lon: -0.1276, lat: 51.5074 },
  { name: "Paris", lon: 2.3522, lat: 48.8566 },
  { name: "Mumbai", lon: 72.8777, lat: 19.076 },
  { name: "São Paulo", lon: -46.6333, lat: -23.5505 },
  { name: "Cairo", lon: 31.2357, lat: 30.0444 },
  { name: "Phnom Penh", lon: 104.916, lat: 11.5564 },
];

function project(lon: number, lat: number): { cx: number; cy: number } {
  return {
    cx: lon + 180,
    cy: 90 - lat,
  };
}

/** Faint continent masses (stylized ellipses on equirectangular grid) */
function ContinentSilhouettes() {
  return (
    <g className="text-white" fill="currentColor" opacity={0.06}>
      <ellipse cx={95} cy={95} rx={42} ry={68} transform="rotate(-8 95 95)" />
      <ellipse cx={175} cy={82} rx={22} ry={48} />
      <ellipse cx={268} cy={78} rx={78} ry={46} />
      <ellipse cx={318} cy={132} rx={24} ry={18} />
      <ellipse cx={200} cy={58} rx={28} ry={22} opacity={0.7} />
    </g>
  );
}

function Graticule() {
  const meridians = [-120, -60, 0, 60, 120, 180].map((lon) => lon + 180);
  const parallels = [-60, -30, 0, 30, 60].map((lat) => 90 - lat);
  return (
    <g className="text-violet-400/20" fill="none" stroke="currentColor" strokeWidth={0.35}>
      {meridians.map((x) => (
        <line key={`m${x}`} x1={x} y1={0} x2={x} y2={VIEW_H} vectorEffect="non-scaling-stroke" />
      ))}
      {parallels.map((y) => (
        <line key={`p${y}`} x1={0} y1={y} x2={VIEW_W} y2={y} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

export default function HeroWorldBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full scale-[1.02]"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="heroMapVignette" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.07)" />
            <stop offset="55%" stopColor="rgba(5,5,8,0)" />
            <stop offset="100%" stopColor="rgba(5,5,8,0.5)" />
          </radialGradient>
          <filter id="heroNeonGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={1.2} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#heroMapVignette)" />
        <Graticule />
        <ContinentSilhouettes />
        {HERO_WORLD_CITIES.map((city, i) => {
          const { cx, cy } = project(city.lon, city.lat);
          const hue = i % 2 === 0 ? "244,114,182" : "192,132,252";
          return (
            <g key={city.name}>
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill={`rgba(${hue},0.45)`}
                filter="url(#heroNeonGlow)"
                className="hero-city-halo"
                style={{
                  animation: `hero-city-pulse ${2.6 + i * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
              <circle
                cx={cx}
                cy={cy}
                r={1.4}
                fill={`rgb(${hue})`}
                style={{
                  filter: `drop-shadow(0 0 3px rgba(${hue},1)) drop-shadow(0 0 9px rgba(${hue},0.55))`,
                }}
              />
            </g>
          );
        })}
      </svg>
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#050508]/20 via-transparent to-[#050508]/85"
        aria-hidden
      />
    </div>
  );
}
