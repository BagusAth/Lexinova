"use client";

// Komponen gerak kecil: konfeti, angka yang menghitung naik, dan toast combo.
// Semua memakai CSS (lihat globals.css) dan otomatis diam bila pengguna
// mengaktifkan "kurangi gerakan" di sistem.

import { useEffect, useState, type CSSProperties } from "react";
import { type Sfx, sfx } from "@/lib/sfx";
import { Icon } from "./cosmic";

const COLORS = ["#6C63FF", "#A99BFF", "#C5B8FF", "#7DD3FC", "#F4F3FF", "#fbbf24", "#fb7185"];

/** Angka semu-acak yang tetap (deterministik), supaya render tetap murni. */
function rand(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Ledakan konfeti satu kali. Ganti `burst` untuk memicu ulang. */
export function Confetti({ count = 70, burst = 0 }: { count?: number; burst?: number }) {
  return (
    <div
      key={burst}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {Array.from({ length: count }, (_, i) => {
        const angle = rand(i, 1) * Math.PI * 2;
        const dist = 160 + rand(i, 2) * 320;
        const style = {
          "--x": `${Math.cos(angle) * dist}px`,
          "--y": `${Math.sin(angle) * dist * 0.7 + 260 + rand(i, 3) * 200}px`,
          "--r": `${(rand(i, 4) - 0.5) * 900}deg`,
          "--d": `${1.2 + rand(i, 5) * 0.9}s`,
          width: `${6 + rand(i, 6) * 6}px`,
          height: `${8 + rand(i, 7) * 10}px`,
          background: COLORS[i % COLORS.length],
          animationDelay: `${rand(i, 8) * 0.15}s`,
          borderRadius: i % 3 === 0 ? "999px" : "2px",
        } as CSSProperties;
        return <i key={i} className="confetti-piece" style={style} />;
      })}
    </div>
  );
}

/** Konfeti + bunyi sekali saat muncul. Aman dipakai di render bersyarat. */
export function Celebrate({ sound = "complete", count }: { sound?: Sfx; count?: number }) {
  useEffect(() => sfx(sound), [sound]);
  return <Confetti count={count} />;
}

/** Angka yang menghitung naik dari 0 ke `to`. */
export function CountUp({
  to,
  duration = 900,
  suffix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

/** Label "+N XP" yang melayang. Pasang `key` berbeda tiap kali muncul. */
export function XpPop({ amount }: { amount: number }) {
  return (
    <span className="animate-float-up pointer-events-none absolute -top-2 right-4 rounded-full bg-gold/20 px-2.5 py-0.5 text-sm font-extrabold text-gold">
      +{amount} XP
    </span>
  );
}

/** Toast combo saat menjawab benar beruntun (3, 5, 10, ...). */
export function ComboToast({ streak }: { streak: number }) {
  return (
    <div
      role="status"
      className="animate-combo pointer-events-none fixed top-20 left-1/2 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fb923c] to-[#f43f5e] px-5 py-2.5 font-extrabold text-ink shadow-glow"
    >
      <Icon kind="flame" size={20} strokeWidth={2.4} />
      {streak} benar beruntun!
    </div>
  );
}

export function isComboMilestone(n: number): boolean {
  return n === 3 || n === 5 || (n >= 10 && n % 5 === 0);
}
