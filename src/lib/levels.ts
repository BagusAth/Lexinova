// Jalur tingkat ala Duolingo: B1 → B1+ → B2 → B2+ → C1.
// Setiap unit materi masuk ke satu tingkat lewat kolom `level` di JSON-nya.
// Unit terbuka berurutan setelah Ujian Unit sebelumnya lulus; tingkat naik
// setelah Ujian Naik Tingkat lulus (bisa juga diambil lebih awal sebagai Uji Lompat).

import type { PlanetTone } from "@/components/cosmic";
import { UNITS } from "./content";
import type { Progress } from "./progress";
import type { Skill, Unit } from "./types";

export type LevelId = "b1" | "b1p" | "b2" | "b2p" | "c1";

export type QKind =
  | "meaning" // istilah → arti (pilihan ganda)
  | "reverse" // arti → istilah (pilihan ganda)
  | "cloze" // isi celah (pilihan atau ketik, tergantung tingkat)
  | "order" // susun kata jadi kalimat
  | "listen" // dengar lalu ketik
  | "grammar"; // pilih kalimat yang benar

export interface Difficulty {
  /** Pengali XP untuk semua latihan di tingkat ini. */
  xpMult: number;
  /** Pilihan kecepatan audio di listening dan ujian. */
  rates: number[];
  /** Boleh membuka transkrip dialog sebelum dikte. */
  transcript: boolean;
  /** Ide jawaban di conversation: selalu tampil, harus diketuk, atau tidak ada. */
  hints: "show" | "tap" | "none";
  /** Isi celah di ujian memakai pilihan jawaban (lebih mudah) atau diketik. */
  clozeChoices: boolean;
  /** Jumlah kata pengecoh di soal susun kata. */
  orderDistractors: number;
  /** Bagian kata yang harus tepat di soal dengar-lalu-ketik. */
  listenPass: number;
  /** Bobot jenis soal di ujian. */
  mix: Record<QKind, number>;
  unitQuestions: number;
  levelQuestions: number;
}

export interface Level {
  id: LevelId;
  cefr: string;
  name: string;
  tone: PlanetTone;
  ielts: string;
  toefl: string;
  /** Yang bisa dilakukan Bagus di tingkat ini, dikaitkan dengan tujuannya. */
  canDo: string;
  difficulty: Difficulty;
}

export const HEARTS = 3;

export const LEVELS: Level[] = [
  {
    id: "b1",
    cefr: "B1",
    name: "Menengah",
    tone: "violet",
    ielts: "4.0–5.0",
    toefl: "42–71",
    canDo:
      "Ikut daily stand-up, menulis email kerja sederhana, dan ngobrol santai saat traveling.",
    difficulty: {
      xpMult: 1,
      rates: [0.75, 1],
      transcript: true,
      hints: "show",
      clozeChoices: true,
      orderDistractors: 0,
      listenPass: 0.75,
      mix: { meaning: 3, reverse: 2, cloze: 3, order: 2, listen: 1, grammar: 1 },
      unitQuestions: 12,
      levelQuestions: 16,
    },
  },
  {
    id: "b1p",
    cefr: "B1+",
    name: "Menengah Mantap",
    tone: "cyan",
    ielts: "5.0–5.5",
    toefl: "60–78",
    canDo:
      "Menceritakan pengalaman kerja saat wawancara dan menulis paragraf opini pendek ala IELTS.",
    difficulty: {
      xpMult: 1.25,
      rates: [0.75, 1],
      transcript: true,
      hints: "tap",
      clozeChoices: false,
      orderDistractors: 1,
      listenPass: 0.8,
      mix: { meaning: 2, reverse: 2, cloze: 3, order: 2, listen: 2, grammar: 1 },
      unitQuestions: 12,
      levelQuestions: 18,
    },
  },
  {
    id: "b2",
    cefr: "B2",
    name: "Menengah Atas",
    tone: "pink",
    ielts: "5.5–6.5",
    toefl: "72–94",
    canDo:
      "Presentasi ide produk, diskusi teknis dengan tim internasional, dan mengejar IELTS 6.5 untuk beasiswa.",
    difficulty: {
      xpMult: 1.5,
      rates: [0.9, 1],
      transcript: false,
      hints: "tap",
      clozeChoices: false,
      orderDistractors: 2,
      listenPass: 0.85,
      mix: { meaning: 1, reverse: 2, cloze: 3, order: 2, listen: 3, grammar: 1 },
      unitQuestions: 14,
      levelQuestions: 20,
    },
  },
  {
    id: "b2p",
    cefr: "B2+",
    name: "Menengah Atas Mantap",
    tone: "teal",
    ielts: "6.5–7.0",
    toefl: "85–100",
    canDo:
      "Bernegosiasi dengan klien, menulis esai akademik terstruktur, dan memahami podcast sains tanpa teks.",
    difficulty: {
      xpMult: 1.75,
      rates: [1],
      transcript: false,
      hints: "none",
      clozeChoices: false,
      orderDistractors: 3,
      listenPass: 0.9,
      mix: { meaning: 0, reverse: 2, cloze: 4, order: 2, listen: 3, grammar: 1 },
      unitQuestions: 14,
      levelQuestions: 20,
    },
  },
  {
    id: "c1",
    cefr: "C1",
    name: "Mahir",
    tone: "amber",
    ielts: "7.0–8.0",
    toefl: "95–113",
    canDo:
      "Memimpin rapat, menulis esai beasiswa yang meyakinkan, dan mengikuti kuliah berbahasa Inggris.",
    difficulty: {
      xpMult: 2,
      rates: [1, 1.15],
      transcript: false,
      hints: "none",
      clozeChoices: false,
      orderDistractors: 3,
      listenPass: 0.9,
      mix: { meaning: 0, reverse: 2, cloze: 4, order: 2, listen: 4, grammar: 1 },
      unitQuestions: 15,
      levelQuestions: 22,
    },
  },
];

// ---- tujuan & minat (personalisasi) ----

export const GOALS = {
  karier: "Karier",
  ielts: "IELTS/TOEFL",
  studi: "Studi & beasiswa",
  travel: "Traveling",
} as const;

export const INTERESTS = {
  teknologi: "Teknologi",
  bisnis: "Bisnis",
  desain: "Desain",
  sains: "Sains & berita",
} as const;

export const TAG_LABEL: Record<string, string> = { ...GOALS, ...INTERESTS };

// ---- unit & tingkat ----

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

export function levelOfUnit(u: Unit): number {
  const i = LEVELS.findIndex((l) => l.cefr === u.level);
  return i < 0 ? 0 : i;
}

export function unitsOfLevel(li: number): Unit[] {
  return UNITS.filter((u) => levelOfUnit(u) === li);
}

/** Tingkat aktif = tingkat pertama yang ujiannya belum lulus. */
export function currentLevel(p: Progress): number {
  const i = LEVELS.findIndex((l) => !p.path.passedLevels[l.id]);
  return i < 0 ? LEVELS.length - 1 : i;
}

export function allLevelsPassed(p: Progress): boolean {
  return LEVELS.every((l) => p.path.passedLevels[l.id]);
}

export function unitUnlocked(p: Progress, u: Unit): boolean {
  const li = levelOfUnit(u);
  const cur = currentLevel(p);
  if (li < cur || allLevelsPassed(p)) return true;
  if (li > cur) return false;
  const list = unitsOfLevel(li);
  const i = list.findIndex((x) => x.id === u.id);
  return i <= 0 || !!p.path.passedUnits[list[i - 1].id];
}

export function unitPassed(p: Progress, u: Unit): boolean {
  return !!p.path.passedUnits[u.id];
}

export function levelReadyForExam(p: Progress, li: number): boolean {
  const list = unitsOfLevel(li);
  return list.length > 0 && list.every((u) => p.path.passedUnits[u.id]);
}

/** Kesulitan latihan mengikuti tingkat unit yang sedang dibuka. */
export function difficultyOf(unit: Unit): Difficulty {
  return LEVELS[levelOfUnit(unit)].difficulty;
}

export function xpMultiplierFor(unitId: string): number {
  const u = UNITS.find((x) => x.id === unitId) ?? UNITS[0];
  return LEVELS[levelOfUnit(u)].difficulty.xpMult;
}

// ---- node jalur dalam satu unit ----

export type NodeKey = Skill | "fondasi" | "grammar" | "ujian";

export const NODE_ORDER: NodeKey[] = [
  "fondasi",
  "grammar",
  "listening",
  "reading",
  "writing",
  "speaking",
  "conversation",
  "ujian",
];

export function nodeDone(p: Progress, u: Unit, key: NodeKey): boolean {
  if (key === "ujian") return unitPassed(p, u);
  if (key === "fondasi") return u.items.every((i) => p.cards[i.id]);
  if (key === "grammar")
    return u.grammar.length > 0 && u.grammar.every((g) => p.done[g.id]);
  const list = u[key] as { id: string }[];
  return list.length > 0 && list.every((x) => p.done[x.id]);
}

export function lessonsDone(p: Progress, u: Unit): number {
  return NODE_ORDER.filter((k) => k !== "ujian" && nodeDone(p, u, k)).length;
}

export const LESSON_COUNT = NODE_ORDER.length - 1;

/** Unit yang sebaiknya dikerjakan sekarang: unit terbuka pertama yang belum lulus. */
export function frontierUnit(p: Progress): Unit {
  return (
    UNITS.find((u) => unitUnlocked(p, u) && !unitPassed(p, u)) ??
    UNITS[UNITS.length - 1]
  );
}

/** Alamat halaman untuk sebuah node jalur. */
export function nodeHref(key: NodeKey, unitId: string): string {
  if (key === "ujian") return examHref("unit", unitId);
  if (key === "grammar") return "/tata-bahasa";
  return `/${key}`;
}

export function examHref(kind: "unit" | "level", id: string): string {
  return `/ujian?${kind === "unit" ? "unit" : "tingkat"}=${id}`;
}
