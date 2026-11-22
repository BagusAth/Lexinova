import type { Skill } from "@/lib/types";

// Setiap keterampilan punya "planet" sendiri.
const PLANET: Record<Skill | "fondasi", { from: string; to: string; ring?: boolean }> = {
  fondasi: { from: "#C5B8FF", to: "#6C63FF" },
  listening: { from: "#7DD3FC", to: "#3b5bdb", ring: true },
  reading: { from: "#F4F3FF", to: "#A99BFF" },
  writing: { from: "#fbcfe8", to: "#a855f7" },
  speaking: { from: "#99f6e4", to: "#0e7490", ring: true },
  conversation: { from: "#fde68a", to: "#f97316" },
};

export function Planet({ kind, size = 44 }: { kind: Skill | "fondasi"; size?: number }) {
  const p = PLANET[kind];
  const id = `pl-${kind}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_10px_rgba(169,155,255,0.45)]">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="100%" stopColor={p.to} />
        </radialGradient>
        <clipPath id={`${id}-front`}>
          <rect x="0" y="24" width="48" height="24" />
        </clipPath>
      </defs>
      {p.ring && (
        <g transform="rotate(-20 24 24)">
          <ellipse cx="24" cy="24" rx="22" ry="6" fill="none" stroke={p.from} strokeOpacity=".4" strokeWidth="2" />
        </g>
      )}
      <circle cx="24" cy="24" r="14" fill={`url(#${id})`} />
      {p.ring && (
        <g transform="rotate(-20 24 24)">
          <ellipse cx="24" cy="24" rx="22" ry="6" fill="none" stroke={p.from} strokeWidth="2" clipPath={`url(#${id}-front)`} />
        </g>
      )}
    </svg>
  );
}

/** Cincin orbit sebagai indikator progres, dengan "bulan" di ujungnya. */
export function OrbitRing({ value, size = 132, children }: { value: number; size?: number; children?: React.ReactNode }) {
  const v = Math.max(0, Math.min(1, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const angle = v * 2 * Math.PI - Math.PI / 2;
  const mx = 60 + r * Math.cos(angle);
  const my = 60 + r * Math.sin(angle);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full">
        <defs>
          <linearGradient id="orbit-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#272847" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#C5B8FF" strokeOpacity=".15" strokeWidth="1" strokeDasharray="2 5" transform="scale(1.12) translate(-6.4 -6.4)" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#orbit-g)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
        {v > 0 && <circle cx={mx} cy={my} r="6" fill="#F4F3FF" style={{ filter: "drop-shadow(0 0 6px #C5B8FF)" }} />}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Logo kecil: planet dengan orbit. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="logo-g" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#C5B8FF" />
          <stop offset="100%" stopColor="#6C63FF" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="#7DD3FC" strokeWidth="2.5" transform="rotate(-25 24 24)" />
      <circle cx="24" cy="24" r="11" fill="url(#logo-g)" />
      <circle cx="41" cy="14" r="2.5" fill="#F4F3FF" />
    </svg>
  );
}
