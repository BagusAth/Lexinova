import type { ReactNode } from "react";
import type { Skill } from "@/lib/types";

/* ---------- Ikon garis ---------- */

export type IconKind =
  | Skill
  | "fondasi"
  | "grammar"
  | "home"
  | "words"
  | "explore"
  | "progress"
  | "settings"
  | "x"
  | "check"
  | "redo"
  | "star"
  | "volume"
  | "chevron"
  | "back"
  | "flame"
  | "book"
  | "upload"
  | "lock"
  | "heart"
  | "trophy"
  | "target";

const PATHS: Record<IconKind, ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  words: (
    <>
      <rect x="4" y="3" width="13" height="17" rx="2" />
      <path d="M8 3v17M20 7v14a1 1 0 01-1 1H7" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  progress: <path d="M4 19V10M10 19V5M16 19v-6M22 19H2" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  fondasi: (
    <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />
  ),
  grammar: <path d="M4 6h11M4 11h8M4 16h6M13 17l3 3 5-6" />,
  listening: (
    <path d="M3 14v-2a9 9 0 0118 0v2M3 14a2 2 0 012-2h1v7H5a2 2 0 01-2-2zM21 14a2 2 0 00-2-2h-1v7h1a2 2 0 002-2z" />
  ),
  reading: (
    <path d="M3 5h6a3 3 0 013 3v12a2 2 0 00-2-2H3zM21 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z" />
  ),
  writing: <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />,
  speaking: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
    </>
  ),
  conversation: <path d="M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-6v-2" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  redo: <path d="M20 12a8 8 0 11-2.3-5.7M20 4v5h-5" />,
  star: (
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  ),
  volume: (
    <path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 18l-6-6 6-6" />,
  flame: (
    <path d="M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3 0-3-1-5.5.5-8z" />
  ),
  book: <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z" />
  ),
  trophy: (
    <path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4.5a3 3 0 003.6 4.4M16 6h3.5a3 3 0 01-3.6 4.4M12 13v4M8.5 20h7M10 17h4v3h-4z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
};

export function Icon({
  kind,
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: {
  kind: IconKind;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[kind]}
    </svg>
  );
}

/* ---------- Ilustrasi ---------- */

const PLANET_TONES = {
  violet: ["#C5B8FF", "#6C63FF", "#3d358f"],
  cyan: ["#bae6fd", "#7DD3FC", "#2563eb"],
  pink: ["#fbcfe8", "#c084fc", "#7e22ce"],
  amber: ["#fde68a", "#fb923c", "#c2410c"],
  teal: ["#99f6e4", "#2dd4bf", "#0f766e"],
  lavender: ["#ede9fe", "#A99BFF", "#5b4fd6"],
} as const;

export type PlanetTone = keyof typeof PLANET_TONES;

export const SKILL_TONE: Record<Skill | "fondasi" | "grammar", PlanetTone> = {
  fondasi: "violet",
  grammar: "lavender",
  listening: "cyan",
  reading: "lavender",
  writing: "pink",
  speaking: "teal",
  conversation: "amber",
};

/** Planet bulat bergradasi, opsional dengan cincin. */
export function Planet({
  tone = "violet",
  size = 64,
  ring = true,
  id,
}: {
  tone?: PlanetTone;
  size?: number;
  ring?: boolean;
  id: string;
}) {
  const [a, b, c] = PLANET_TONES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={a} />
          <stop offset="55%" stopColor={b} />
          <stop offset="100%" stopColor={c} />
        </radialGradient>
        <clipPath id={`${id}-front`}>
          <rect x="0" y="50" width="100" height="60" />
        </clipPath>
      </defs>
      {ring && (
        <g transform="rotate(-18 50 50)">
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="12"
            fill="none"
            stroke={a}
            strokeOpacity=".35"
            strokeWidth="4"
          />
        </g>
      )}
      <circle cx="50" cy="50" r="28" fill={`url(#${id}-g)`} />
      <path
        d="M30 44c8 3 22 3 40-2"
        stroke={a}
        strokeOpacity=".35"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M28 56c10 3 26 3 44-3"
        stroke={c}
        strokeOpacity=".35"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {ring && (
        <g transform="rotate(-18 50 50)">
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="12"
            fill="none"
            stroke={a}
            strokeWidth="4"
            clipPath={`url(#${id}-front)`}
          />
        </g>
      )}
    </svg>
  );
}

/** Bintang empat sudut kecil yang berkilau. */
export function Sparkle({
  size = 14,
  className = "",
  color = "#F4F3FF",
  delay = 0,
}: {
  size?: number;
  className?: string;
  color?: string;
  delay?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`sparkle ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <path
        d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z"
        fill={color}
      />
    </svg>
  );
}

/** Astronot kecil yang lucu. */
export function Astronaut({ size = 96, id }: { size?: number; id: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#6C63FF" />
        </linearGradient>
      </defs>
      {/* ransel */}
      <rect x="30" y="56" width="60" height="40" rx="14" fill="#c9c6ee" />
      {/* badan */}
      <rect x="36" y="58" width="48" height="42" rx="18" fill="#F4F3FF" />
      <rect x="50" y="70" width="20" height="12" rx="4" fill="#A99BFF" />
      <circle cx="55" cy="76" r="2" fill="#F4F3FF" />
      <circle cx="65" cy="76" r="2" fill="#7DD3FC" />
      {/* lengan */}
      <rect
        x="22"
        y="62"
        width="16"
        height="28"
        rx="8"
        fill="#F4F3FF"
        transform="rotate(20 30 76)"
      />
      <rect
        x="82"
        y="50"
        width="16"
        height="28"
        rx="8"
        fill="#F4F3FF"
        transform="rotate(-35 90 64)"
      />
      {/* kaki */}
      <rect x="42" y="92" width="14" height="18" rx="7" fill="#F4F3FF" />
      <rect x="64" y="92" width="14" height="18" rx="7" fill="#F4F3FF" />
      {/* helm */}
      <circle cx="60" cy="38" r="28" fill="#F4F3FF" />
      <rect
        x="38"
        y="24"
        width="44"
        height="30"
        rx="15"
        fill={`url(#${id}-visor)`}
      />
      <path
        d="M46 32c4-4 9-5 14-4"
        stroke="#F4F3FF"
        strokeOpacity=".75"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="74" cy="44" r="2.5" fill="#F4F3FF" fillOpacity=".6" />
      {/* antena */}
      <line
        x1="60"
        y1="10"
        x2="60"
        y2="3"
        stroke="#c9c6ee"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="3" r="3.5" fill="#fcd34d" />
    </svg>
  );
}

/** Adegan astronot duduk di bulan, untuk kartu misi harian. */
export function MoonScene({ size = 150 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 160 160"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="moon-g" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ede9fe" />
            <stop offset="100%" stopColor="#A99BFF" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="122" r="52" fill="url(#moon-g)" />
        <circle cx="58" cy="108" r="8" fill="#8f82f0" fillOpacity=".45" />
        <circle cx="100" cy="128" r="11" fill="#8f82f0" fillOpacity=".4" />
        <circle cx="76" cy="140" r="5" fill="#8f82f0" fillOpacity=".4" />
        {/* bendera */}
        <line
          x1="120"
          y1="80"
          x2="120"
          y2="40"
          stroke="#F4F3FF"
          strokeWidth="2.5"
        />
        <path d="M120 40h20l-5 7 5 7h-20z" fill="#fcd34d" />
      </svg>
      <div className="animate-float absolute left-[18%] top-[2%]">
        <Astronaut size={size * 0.56} id="moonscene-astro" />
      </div>
    </div>
  );
}

/** Lencana heksagon dengan bintang emas di dalam orbit. */
export function HexBadge({ size = 160 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="hex-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a80ff" />
          <stop offset="100%" stopColor="#3d358f" />
        </linearGradient>
        <radialGradient id="star-g" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="74" fill="#6C63FF" fillOpacity=".15" />
      <path
        d="M80 14l57 33v66l-57 33-57-33V47z"
        fill="url(#hex-g)"
        stroke="#C5B8FF"
        strokeWidth="3"
      />
      <g className="animate-spin-slow" style={{ transformOrigin: "80px 80px" }}>
        <ellipse
          cx="80"
          cy="80"
          rx="48"
          ry="18"
          fill="none"
          stroke="#7DD3FC"
          strokeWidth="2.5"
          strokeDasharray="4 6"
          transform="rotate(-25 80 80)"
        />
      </g>
      <path
        d="M80 50l9 18.5 20.5 3-14.8 14.4 3.5 20.4L80 96.6l-18.2 9.7 3.5-20.4L50.5 71.5l20.5-3z"
        fill="url(#star-g)"
      />
    </svg>
  );
}

/** Lingkar progres bergradasi. */
export function OrbitRing({
  value,
  size = 132,
  children,
}: {
  value: number;
  size?: number;
  children?: ReactNode;
}) {
  const v = Math.max(0, Math.min(1, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id="orbit-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A99BFF" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--elevated)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#orbit-g)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}

/** Logo: bintang di dalam orbit. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C5B8FF" />
          <stop offset="100%" stopColor="#6C63FF" />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="24"
        rx="21"
        ry="9"
        fill="none"
        stroke="#7DD3FC"
        strokeWidth="2.2"
        transform="rotate(-28 24 24)"
      />
      <path
        d="M24 8c1.3 8.2 6.8 13.7 15 15-8.2 1.3-13.7 6.8-15 15-1.3-8.2-6.8-13.7-15-15 8.2-1.3 13.7-6.8 15-15z"
        fill="url(#logo-g)"
      />
      <circle cx="42" cy="13" r="2" fill="#F4F3FF" />
    </svg>
  );
}
