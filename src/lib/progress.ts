"use client";

// Semua progres disimpan di localStorage (tanpa server). Bisa diekspor/impor sebagai JSON.

import { useSyncExternalStore } from "react";
import type { Card } from "ts-fsrs";

const KEY = "lexinova:progress:v1";

export interface DaySession {
  xp: number;
  correct: number;
  total: number;
  newWords: string[]; // item id yang pertama kali dipelajari hari ini
  minutes: number;
  reviewed: string[]; // item id yang direview hari ini
}

export interface Progress {
  version: 1;
  cards: Record<string, Card>; // status FSRS per item
  days: Record<string, DaySession>; // kunci: YYYY-MM-DD (waktu lokal)
  done: Record<string, { date: string; score?: number }>; // latihan keterampilan yang sudah selesai
  settings: {
    dailyGoal: number;
    unitId: string;
    newPerDay: number;
    name: string;
    autoVoice: boolean;
    onboarded: boolean;
  };
  achievements: Record<string, string>; // id pencapaian -> tanggal didapat
}

export const emptyProgress = (): Progress => ({
  version: 1,
  cards: {},
  days: {},
  done: {},
  settings: {
    dailyGoal: 50,
    unitId: "en-u01",
    newPerDay: 6,
    name: "",
    autoVoice: true,
    onboarded: false,
  },
  achievements: {},
});

export const emptyDay = (): DaySession => ({
  xp: 0,
  correct: 0,
  total: 0,
  newWords: [],
  minutes: 0,
  reviewed: [],
});

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- store ----

let cache: Progress | null = null;
const listeners = new Set<() => void>();

function reviveCards(cards: Record<string, Card>): Record<string, Card> {
  const out: Record<string, Card> = {};
  for (const [id, c] of Object.entries(cards ?? {})) {
    out[id] = {
      ...c,
      due: new Date(c.due),
      last_review: c.last_review ? new Date(c.last_review) : undefined,
    };
  }
  return out;
}

function parse(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  try {
    const p = JSON.parse(raw) as Progress;
    const base = emptyProgress();
    return {
      ...base,
      ...p,
      settings: { ...base.settings, ...p.settings },
      achievements: { ...(p.achievements ?? {}) },
      cards: reviveCards(p.cards),
    };
  } catch {
    return emptyProgress();
  }
}

function read(): Progress {
  if (cache) return cache;
  try {
    cache = parse(localStorage.getItem(KEY));
  } catch {
    cache = emptyProgress();
  }
  return cache;
}

function write(p: Progress) {
  cache = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // penyimpanan penuh atau diblokir; progres tetap ada di memori sampai tab ditutup
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Progres saat ini; null selama render di server (belum ada localStorage). */
export function useProgress(): Progress | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function getProgress(): Progress {
  return read();
}

export function update(fn: (p: Progress) => Progress | void) {
  const draft = structuredClone(read());
  const next = fn(draft) ?? draft;
  write(next);
}

export function updateToday(fn: (d: DaySession) => void) {
  update((p) => {
    const k = todayKey();
    const d = p.days[k] ?? emptyDay();
    fn(d);
    p.days[k] = d;
  });
}

export function addResult(correct: number, total: number, xp: number) {
  updateToday((d) => {
    d.correct += correct;
    d.total += total;
    d.xp += xp;
  });
}

export function markDone(exerciseId: string, score?: number) {
  update((p) => {
    p.done[exerciseId] = { date: todayKey(), score };
  });
}

// ---- streak ----

export function streak(p: Progress, now = new Date()): number {
  let count = 0;
  const d = new Date(now);
  // Hari ini belum belajar tidak memutus streak.
  if (!(p.days[todayKey(d)]?.xp > 0)) d.setDate(d.getDate() - 1);
  while (p.days[todayKey(d)]?.xp > 0) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// ---- ekspor / impor ----

export function exportJson(): string {
  return JSON.stringify(read(), null, 2);
}

export function importJson(text: string): void {
  const p = JSON.parse(text) as Progress;
  if (p?.version !== 1 || typeof p.cards !== "object")
    throw new Error("Format file tidak dikenali.");
  write(parse(text));
}

export function resetProgress() {
  write(emptyProgress());
}
