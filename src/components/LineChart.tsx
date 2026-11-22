"use client";

import { useState } from "react";

/** Grafik garis halus untuk XP harian, dengan titik yang bisa disentuh untuk melihat nilai. */
export function LineChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 200;
  const pad = { l: 8, r: 8, t: 16, b: 8 };
  const max = Math.max(10, ...data);
  const n = data.length;
  const x = (i: number) =>
    pad.l + (n === 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = data.map((v, i) => [x(i), y(v)] as const);

  // Kurva Catmull-Rom → Bézier supaya garisnya halus.
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${Math.min(H - pad.b, c1[1])} ${c2[0]},${Math.min(H - pad.b, c2[1])} ${p2[0]},${p2[1]}`;
  }
  const area = `${d} L${pts[n - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const showDots = n <= 10;
  const active = hover ?? n - 1;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-44 w-full overflow-visible sm:h-52"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C63FF" stopOpacity=".45" />
              <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lc-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#A99BFF" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={pad.t + f * (H - pad.t - pad.b)}
              y2={pad.t + f * (H - pad.t - pad.b)}
              stroke="#2e2f55"
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill="url(#lc-area)" />
          <path
            d={d}
            fill="none"
            stroke="url(#lc-line)"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* area sentuh per titik */}
          {pts.map(([px], i) => (
            <rect
              key={i}
              x={px - W / n / 2}
              y={0}
              width={W / n}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(i)}
            />
          ))}
          <line
            x1={pts[active][0]}
            x2={pts[active][0]}
            y1={pts[active][1]}
            y2={H}
            stroke="#A99BFF"
            strokeOpacity=".4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Titik dibuat dengan HTML supaya tetap bulat walau SVG diregangkan */}
        {pts.map(([px, py], i) =>
          showDots || i === active ? (
            <span
              key={i}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg ${i === active ? "size-4 bg-cyan" : "size-2.5 bg-lavender"}`}
              style={{ left: `${(px / W) * 100}%`, top: `${(py / H) * 100}%` }}
            />
          ) : null,
        )}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-elevated px-2.5 py-1 text-xs font-bold whitespace-nowrap shadow-soft"
          style={{
            left: `${Math.min(90, Math.max(10, (pts[active][0] / W) * 100))}%`,
            top: `calc(${(pts[active][1] / H) * 100}% - 12px)`,
          }}
        >
          {data[active]} XP
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-mute">
        {labels.map((l, i) => (
          <span key={i} className={i === active ? "text-ink" : ""}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
