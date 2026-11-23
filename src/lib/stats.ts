// Angka-angka untuk beranda dan halaman progres.

import { State } from "ts-fsrs";
import type { Progress } from "./progress";
import { todayKey } from "./progress";
import type { Item, Skill, Unit } from "./types";

export type WordStatus = "baru" | "belajar" | "dikuasai";

export function wordStatus(p: Progress, id: string): WordStatus {
  const c = p.cards[id];
  if (!c) return "baru";
  // Dianggap dikuasai bila sudah tahap review dan diingat minimal ±3 minggu.
  return c.state === State.Review && c.stability >= 21 ? "dikuasai" : "belajar";
}

/** Jumlah kartu yang sudah dipelajari; bila `lang` diisi, hanya kursus itu. */
export function vocabCount(p: Progress, lang?: string): number {
  const ids = Object.keys(p.cards);
  return lang ? ids.filter((id) => id.startsWith(`${lang}-`)).length : ids.length;
}

/** XP per hari untuk n hari terakhir (paling lama di kiri). */
export function xpSeries(
  p: Progress,
  days: number,
  now = new Date(),
): { key: string; date: Date; xp: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - 1 - i));
    const key = todayKey(d);
    return { key, date: d, xp: p.days[key]?.xp ?? 0 };
  });
}

/** Persentase perubahan total XP periode ini dibanding periode sebelumnya. */
export function changeVsPrevious(
  p: Progress,
  days: number,
  now = new Date(),
): number | null {
  const cur = xpSeries(p, days, now).reduce((a, b) => a + b.xp, 0);
  const prevEnd = new Date(now);
  prevEnd.setDate(now.getDate() - days);
  const prev = xpSeries(p, days, prevEnd).reduce((a, b) => a + b.xp, 0);
  if (prev === 0) return cur > 0 ? null : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Bagian unit yang sudah diselesaikan per keterampilan (0..1). */
export function skillProgress(p: Progress, unit: Unit, skill: Skill): number {
  const list = unit[skill] as { id: string }[];
  if (!list.length) return 0;
  return list.filter((x) => p.done[x.id]).length / list.length;
}

export function foundationProgress(p: Progress, items: Item[]): number {
  if (!items.length) return 0;
  return items.filter((i) => p.cards[i.id]).length / items.length;
}

export function longestStreak(p: Progress): number {
  const keys = Object.keys(p.days)
    .filter((k) => p.days[k].xp > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const d = new Date(`${k}T00:00:00`);
    run = prev && Math.round((+d - +prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}
