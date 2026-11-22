"use client";

// Review kartu fondasi dengan algoritma FSRS (pustaka ts-fsrs).

import { createEmptyCard, fsrs, Rating, type Grade } from "ts-fsrs";
import type { Item } from "./types";
import { type Progress, todayKey, update } from "./progress";

const scheduler = fsrs({ enable_fuzz: true });

export { Rating };
export type { Grade };

export interface Queue {
  due: Item[]; // kartu lama yang jatuh tempo
  fresh: Item[]; // kartu baru untuk hari ini
}

export function buildQueue(p: Progress, items: Item[], now = new Date()): Queue {
  const due = items
    .filter((i) => p.cards[i.id] && p.cards[i.id].due <= now)
    .sort((a, b) => +p.cards[a.id].due - +p.cards[b.id].due);
  const learnedToday = p.days[todayKey(now)]?.newWords.length ?? 0;
  const allowance = Math.max(0, p.settings.newPerDay - learnedToday);
  const fresh = items.filter((i) => !p.cards[i.id]).slice(0, allowance);
  return { due, fresh };
}

/** Simpan nilai kartu. Mengembalikan tanggal jatuh tempo berikutnya. */
export function gradeCard(itemId: string, grade: Grade, now = new Date()): Date {
  let nextDue = now;
  update((p) => {
    const isNew = !p.cards[itemId];
    const card = p.cards[itemId] ?? createEmptyCard(now);
    const { card: next } = scheduler.next(card, now, grade);
    p.cards[itemId] = next;
    nextDue = next.due;
    const k = todayKey(now);
    const day = p.days[k] ?? { xp: 0, correct: 0, total: 0, newWords: [], minutes: 0, reviewed: [] };
    if (isNew && !day.newWords.includes(itemId)) day.newWords.push(itemId);
    if (!day.reviewed.includes(itemId)) day.reviewed.push(itemId);
    day.total += 1;
    if (grade !== Rating.Again) day.correct += 1;
    day.xp += grade === Rating.Again ? 1 : 2;
    p.days[k] = day;
  });
  return nextDue;
}

/** Tambah kata dari glosarium bacaan ke antrean review (sebagai kartu baru yang langsung jatuh tempo). */
export function addToReview(itemId: string, now = new Date()) {
  update((p) => {
    if (!p.cards[itemId]) p.cards[itemId] = createEmptyCard(now);
  });
}

export function dueTomorrow(p: Progress, now = new Date()): string[] {
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  return Object.entries(p.cards)
    .filter(([, c]) => c.due <= end)
    .map(([id]) => id);
}
