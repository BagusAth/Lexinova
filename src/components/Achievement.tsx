"use client";

import { type Progress, streak, todayKey, update } from "@/lib/progress";
import { vocabCount } from "@/lib/stats";
import { HexBadge, Sparkle } from "./cosmic";
import { Button } from "./ui";

interface Pending {
  id: string;
  title: string;
  text: string;
}

const STREAKS = [3, 7, 14, 30, 60, 100];
const VOCAB = [10, 25, 50, 100, 250];

/** Pencapaian pertama yang belum diklaim, atau null. */
function pending(p: Progress): Pending | null {
  const today = todayKey();
  const xp = p.days[today]?.xp ?? 0;
  if (xp >= p.settings.dailyGoal && !p.achievements[`goal-${today}`])
    return {
      id: `goal-${today}`,
      title: "Target harian tercapai!",
      text: `Kamu mengumpulkan ${xp} XP hari ini. Orbitmu makin stabil.`,
    };
  const s = streak(p);
  for (const n of STREAKS)
    if (s >= n && !p.achievements[`streak-${n}`])
      return {
        id: `streak-${n}`,
        title: `${n} hari beruntun!`,
        text: `Kamu belajar ${n} hari tanpa putus. Pertahankan!`,
      };
  const v = vocabCount(p);
  for (const n of VOCAB)
    if (v >= n && !p.achievements[`vocab-${n}`])
      return {
        id: `vocab-${n}`,
        title: `${n} kata dipelajari!`,
        text: `Koleksi kosakatamu sudah ${n} kata.`,
      };
  return null;
}

export function Achievement({ p }: { p: Progress }) {
  const a = pending(p);
  if (!a) return null;

  const claim = () =>
    update((d) => {
      d.achievements[a.id] = todayKey();
    });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0b0c1d]/80 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ach-title"
    >
      <div className="animate-pop relative flex w-full max-w-sm flex-col items-center gap-3 overflow-hidden rounded-[2rem] bg-elevated px-6 pt-10 pb-6 text-center shadow-glow">
        <Sparkle className="absolute top-6 left-8" size={14} />
        <Sparkle
          className="absolute top-14 right-10"
          size={10}
          color="#7DD3FC"
          delay={0.8}
        />
        <Sparkle
          className="absolute bottom-24 left-12"
          size={9}
          color="#C5B8FF"
          delay={1.4}
        />
        <div className="text-sm font-semibold tracking-wide text-lavender uppercase">
          Pencapaian terbuka
        </div>
        <HexBadge size={150} />
        <h2 id="ach-title" className="text-2xl font-extrabold">
          {a.title}
        </h2>
        <p className="text-mute">{a.text}</p>
        <Button className="mt-2 w-full md:w-full" onClick={claim} autoFocus>
          Mantap!
        </Button>
      </div>
    </div>
  );
}
