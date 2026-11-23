"use client";

// Semua progres disimpan di localStorage (tanpa server). Bisa diekspor/impor sebagai JSON.

import { useSyncExternalStore } from "react";
import type { Card } from "ts-fsrs";
import { xpMultiplierFor } from "./levels";

const KEY = "lexinova:progress:v1";

export interface DaySession {
  xp: number;
  correct: number;
  total: number;
  newWords: string[]; // item id yang pertama kali dipelajari hari ini
  minutes: number;
  reviewed: string[]; // item id yang direview hari ini
}

export interface ExamRecord {
  best: number; // skor terbaik 0..1
  attempts: number;
  passed: boolean;
  last: string; // tanggal percobaan terakhir
}

export interface PathState {
  passedUnits: Record<string, string>; // unit id -> tanggal lulus Ujian Unit
  passedLevels: Record<string, string>; // level id -> tanggal lulus Ujian Naik Tingkat
  exams: Record<string, ExamRecord>; // "unit:en-u01" / "level:b1"
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
    goals: string[]; // kunci GOALS di levels.ts
    interests: string[]; // kunci INTERESTS di levels.ts
    targetLevel: string; // level id yang ingin dicapai
  };
  achievements: Record<string, string>; // id pencapaian -> tanggal didapat
  path: PathState;
}

/** Lexinova hanya dipakai satu orang, jadi profil langsung terisi tanpa layar sambutan. */
export const OWNER = "Bagus Athallah";

/** Nama panggilan (kata pertama) untuk sapaan singkat. */
export function firstName(p: Progress): string {
  return (p.settings.name.trim() || OWNER).split(/\s+/)[0];
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
    name: OWNER,
    autoVoice: true,
    goals: ["karier", "ielts", "studi", "travel"],
    interests: ["teknologi", "bisnis", "desain", "sains"],
    targetLevel: "b2",
  },
  achievements: {},
  path: { passedUnits: {}, passedLevels: {}, exams: {} },
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
    const settings = { ...base.settings, ...p.settings };
    if (!settings.name?.trim()) settings.name = OWNER;
    return {
      ...base,
      ...p,
      settings,
      achievements: { ...(p.achievements ?? {}) },
      // Progres lama (sebelum ada jalur tingkat) tetap terbaca.
      path: {
        passedUnits: { ...(p.path?.passedUnits ?? {}) },
        passedLevels: { ...(p.path?.passedLevels ?? {}) },
        exams: { ...(p.path?.exams ?? {}) },
      },
      cards: reviveCards(p.cards),
    };
  } catch {
    // Data rusak: simpan salinan mentahnya dulu supaya tidak hilang tertimpa,
    // lalu mulai dari progres kosong. Salinan bisa dipulihkan secara manual.
    try {
      localStorage.setItem(`${KEY}:rusak:${Date.now()}`, raw);
    } catch {}
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

let saveFailed = false;

/** true bila penulisan terakhir ke localStorage gagal (penuh/diblokir). */
export function lastSaveFailed(): boolean {
  return saveFailed;
}

function write(p: Progress) {
  cache = p;
  try {
    // Ditulis langsung (sinkron) setiap ada perubahan, jadi tidak ada yang
    // tertunda saat tab atau browser ditutup.
    localStorage.setItem(KEY, JSON.stringify(p));
    saveFailed = false;
  } catch {
    // Penyimpanan penuh atau diblokir (mis. mode penyamaran ketat).
    // Progres tetap ada di memori; AppShell menampilkan peringatan.
    saveFailed = true;
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

/** XP dasar dikali pengali tingkat unit yang sedang dibuka (tingkat tinggi = XP lebih besar). */
export function scaledXp(base: number, p = read()): number {
  return Math.round(base * xpMultiplierFor(p.settings.unitId));
}

export function addResult(correct: number, total: number, xp: number) {
  const gained = scaledXp(xp);
  updateToday((d) => {
    d.correct += correct;
    d.total += total;
    d.xp += gained;
  });
}

export function markDone(exerciseId: string, score?: number) {
  update((p) => {
    p.done[exerciseId] = { date: todayKey(), score };
  });
}

/**
 * Simpan hasil ujian (skor terbaik, jumlah percobaan) dan, bila lulus,
 * jalankan `apply` untuk membuka unit/tingkat berikutnya. Semua dalam satu tulis.
 */
export function saveExam(
  key: string,
  score: number,
  passed: boolean,
  apply?: (p: Progress) => void,
) {
  update((p) => {
    const prev = p.path.exams[key];
    p.path.exams[key] = {
      best: Math.max(prev?.best ?? 0, score),
      attempts: (prev?.attempts ?? 0) + 1,
      passed: !!prev?.passed || passed,
      last: todayKey(),
    };
    apply?.(p);
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

// ---- penyimpanan permanen ----

/**
 * Minta browser menandai penyimpanan situs ini sebagai permanen, supaya
 * localStorage tidak ikut dibersihkan otomatis saat ruang disk menipis.
 * Chrome/Edge biasanya langsung mengizinkan untuk situs yang sering dibuka
 * atau dipasang sebagai aplikasi (PWA).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storagePersisted(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
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
