import type { ReactNode } from "react";
import type { Skill } from "@/lib/types";

type IconKind = Skill | "fondasi" | "home" | "latihan" | "hasil" | "pengaturan";

// Ikon garis sederhana, satu warna, mengikuti currentColor.
const PATHS: Record<IconKind, ReactNode> = {
  home: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-25 12 12)" />
    </>
  ),
  fondasi: <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />,
  latihan: (
    <>
      <circle cx="5" cy="7" r="1.5" />
      <circle cx="12" cy="4" r="1.5" />
      <circle cx="19" cy="9" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
      <path d="M6.3 6.3l4.4-1.6M13.4 4.7l4.3 3.6M18.4 10.4l-2.7 6.2M13.5 18l-5-.8M6.6 15.5L5.2 8.5" />
    </>
  ),
  hasil: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  pengaturan: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  listening: <path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4M21 12h0" />,
  reading: <path d="M3 5h6a3 3 0 013 3v12a2 2 0 00-2-2H3zM21 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z" />,
  writing: <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3M4 20h16" />,
  speaking: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
    </>
  ),
  conversation: <path d="M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-6v-2" />,
};

export function Icon({ kind, size = 20, className = "" }: { kind: IconKind; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[kind]}
    </svg>
  );
}

/** Lingkar orbit tipis sebagai indikator progres, dengan "bulan" di ujungnya. */
export function OrbitRing({ value, size = 132, children }: { value: number; size?: number; children?: ReactNode }) {
  const v = Math.max(0, Math.min(1, value));
  const r = 54;
  const c = 2 * Math.PI * r;
  const angle = v * 2 * Math.PI - Math.PI / 2;
  const mx = 60 + r * Math.cos(angle);
  const my = 60 + r * Math.sin(angle);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="1.5" />
        {/* Tanda skala seperti cakram jam bintang */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * 2 * Math.PI;
          const r1 = i % 6 === 0 ? 44 : 47;
          return (
            <line
              key={i}
              x1={60 + r1 * Math.cos(a)}
              y1={60 + r1 * Math.sin(a)}
              x2={60 + 49 * Math.cos(a)}
              y2={60 + 49 * Math.sin(a)}
              stroke="var(--line)"
              strokeWidth="1"
            />
          );
        })}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--lavender)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
        <circle cx={mx} cy={my} r="4.5" fill="var(--ink)" stroke="var(--bg)" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Logo: planet kecil dengan orbit miring, flat. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="10" fill="var(--primary)" />
      <ellipse cx="24" cy="24" rx="20" ry="7" fill="none" stroke="var(--cyan)" strokeWidth="2" transform="rotate(-25 24 24)" />
      <circle cx="40" cy="12" r="2.2" fill="var(--ink)" />
    </svg>
  );
}
