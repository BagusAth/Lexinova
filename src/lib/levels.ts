// Kursus dan jalur tingkat ala Duolingo.
//  - Bahasa Inggris: B1 → B1+ → B2 → B2+ → C1
//  - Bahasa Jepang:  Kana → N5 → N4 → N3 → N2 → N1
// Setiap unit materi masuk ke satu tingkat lewat kolom `level` di JSON-nya,
// dan ke satu kursus lewat kolom `language`. Unit terbuka berurutan setelah
// Ujian Unit sebelumnya lulus; tingkat naik setelah Ujian Naik Tingkat lulus
// (bisa juga diambil lebih awal sebagai Uji Lompat).

import type { PlanetTone } from "@/components/cosmic";
import { getUnit, UNITS } from "./content";
import type { Progress } from "./progress";
import type { Skill, Unit } from "./types";

export type Lang = "en" | "ja";

export type QKind =
  | "meaning" // istilah → arti (pilihan ganda)
  | "reverse" // arti → istilah (pilihan ganda)
  | "cloze" // isi celah (pilihan atau ketik, tergantung tingkat)
  | "order" // susun kata jadi kalimat
  | "listen" // dengar lalu ketik / susun / pilih
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
  /** Bagian kata/huruf yang harus tepat di soal dengar. */
  listenPass: number;
  /** Soal dengar: diketik (Inggris) atau disusun dari ubin (Jepang, tanpa keyboard Jepang). */
  listenMode: "type" | "tiles";
  /** Romaji boleh tampil di tingkat ini (Jepang). */
  romaji: boolean;
  /** Furigana selalu tampil, atau hanya saat kanji diketuk (Jepang). */
  furigana: "always" | "tap";
  /** Bobot jenis soal di ujian. */
  mix: Record<QKind, number>;
  unitQuestions: number;
  levelQuestions: number;
}

export interface Level {
  id: string;
  /** Label tingkat, sama dengan kolom `level` di JSON unit (B1, N5, Kana, ...). */
  cefr: string;
  name: string;
  tone: PlanetTone;
  /** Penanda singkat: perkiraan IELTS/TOEFL atau JLPT. */
  badges: string[];
  /** Yang bisa dilakukan Bagus di tingkat ini, dikaitkan dengan tujuannya. */
  canDo: string;
  difficulty: Difficulty;
}

export interface Course {
  lang: Lang;
  code: string;
  name: string;
  /** Kode suara/pengenalan suara browser. */
  speech: string;
  colors: [string, string];
  levels: Level[];
}

export const HEARTS = 3;

const EN_BASE = {
  listenMode: "type",
  romaji: false,
  furigana: "always",
} as const;

const EN_LEVELS: Level[] = [
  {
    id: "b1",
    cefr: "B1",
    name: "Menengah",
    tone: "violet",
    badges: ["≈ IELTS 4.0–5.0", "≈ TOEFL iBT 42–71"],
    canDo:
      "Ikut daily stand-up, menulis email kerja sederhana, dan ngobrol santai saat traveling.",
    difficulty: {
      ...EN_BASE,
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
    badges: ["≈ IELTS 5.0–5.5", "≈ TOEFL iBT 60–78"],
    canDo:
      "Menceritakan pengalaman kerja saat wawancara dan menulis paragraf opini pendek ala IELTS.",
    difficulty: {
      ...EN_BASE,
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
    badges: ["≈ IELTS 5.5–6.5", "≈ TOEFL iBT 72–94"],
    canDo:
      "Presentasi ide produk, diskusi teknis dengan tim internasional, dan mengejar IELTS 6.5 untuk beasiswa.",
    difficulty: {
      ...EN_BASE,
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
    badges: ["≈ IELTS 6.5–7.0", "≈ TOEFL iBT 85–100"],
    canDo:
      "Bernegosiasi dengan klien, menulis esai akademik terstruktur, dan memahami podcast sains tanpa teks.",
    difficulty: {
      ...EN_BASE,
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
    badges: ["≈ IELTS 7.0–8.0", "≈ TOEFL iBT 95–113"],
    canDo:
      "Memimpin rapat, menulis esai beasiswa yang meyakinkan, dan mengikuti kuliah berbahasa Inggris.",
    difficulty: {
      ...EN_BASE,
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

// Bahasa Jepang: tanpa mengetik (ubin dan pilihan ganda), seperti Duolingo.
const JA_BASE = {
  listenMode: "tiles",
  clozeChoices: true,
} as const;

const JA_LEVELS: Level[] = [
  {
    id: "kana",
    cefr: "Kana",
    name: "Huruf dasar",
    tone: "pink",
    badges: ["Hiragana & katakana", "91 huruf"],
    canDo:
      "Membaca hiragana dan katakana: nama menu, papan stasiun, dan judul anime favoritmu.",
    difficulty: {
      ...JA_BASE,
      xpMult: 1,
      rates: [0.75, 1],
      transcript: true,
      hints: "show",
      orderDistractors: 0,
      listenPass: 0.7,
      romaji: true,
      furigana: "always",
      mix: { meaning: 4, reverse: 3, cloze: 0, order: 0, listen: 3, grammar: 1 },
      unitQuestions: 12,
      levelQuestions: 16,
    },
  },
  {
    id: "n5",
    cefr: "N5",
    name: "Pemula",
    tone: "violet",
    badges: ["JLPT N5", "± 800 kata · 100 kanji"],
    canDo:
      "Memperkenalkan diri, memesan makanan, bertanya arah, dan membeli tiket saat traveling ke Jepang.",
    difficulty: {
      ...JA_BASE,
      xpMult: 1.25,
      rates: [0.75, 1],
      transcript: true,
      hints: "show",
      orderDistractors: 1,
      listenPass: 0.75,
      romaji: true,
      furigana: "always",
      mix: { meaning: 3, reverse: 2, cloze: 2, order: 3, listen: 2, grammar: 1 },
      unitQuestions: 12,
      levelQuestions: 16,
    },
  },
  {
    id: "n4",
    cefr: "N4",
    name: "Dasar Mantap",
    tone: "cyan",
    badges: ["JLPT N4", "± 1.500 kata · 300 kanji"],
    canDo:
      "Meminta izin dan tolong dengan sopan di kantor, bercerita tentang hobi dan anime, serta membuat rencana.",
    difficulty: {
      ...JA_BASE,
      xpMult: 1.5,
      rates: [0.9, 1],
      transcript: true,
      hints: "tap",
      orderDistractors: 2,
      listenPass: 0.8,
      romaji: false,
      furigana: "always",
      mix: { meaning: 2, reverse: 2, cloze: 3, order: 3, listen: 3, grammar: 1 },
      unitQuestions: 14,
      levelQuestions: 18,
    },
  },
  {
    id: "n3",
    cefr: "N3",
    name: "Menengah",
    tone: "teal",
    badges: ["JLPT N3", "± 3.700 kata · 650 kanji"],
    canDo:
      "Mengikuti percakapan sehari-hari dengan kecepatan hampir normal dan membaca artikel singkat.",
    difficulty: {
      ...JA_BASE,
      xpMult: 1.75,
      rates: [1],
      transcript: false,
      hints: "tap",
      orderDistractors: 3,
      listenPass: 0.85,
      romaji: false,
      furigana: "tap",
      mix: { meaning: 1, reverse: 2, cloze: 3, order: 3, listen: 4, grammar: 1 },
      unitQuestions: 14,
      levelQuestions: 20,
    },
  },
  {
    id: "n2",
    cefr: "N2",
    name: "Menengah Atas",
    tone: "lavender",
    badges: ["JLPT N2", "± 6.000 kata · 1.000 kanji"],
    canDo:
      "Bekerja di kantor Jepang, memahami berita, dan memakai keigo dengan percaya diri.",
    difficulty: {
      ...JA_BASE,
      xpMult: 2,
      rates: [1, 1.1],
      transcript: false,
      hints: "none",
      orderDistractors: 3,
      listenPass: 0.9,
      romaji: false,
      furigana: "tap",
      mix: { meaning: 0, reverse: 2, cloze: 4, order: 3, listen: 4, grammar: 1 },
      unitQuestions: 15,
      levelQuestions: 22,
    },
  },
  {
    id: "n1",
    cefr: "N1",
    name: "Mahir",
    tone: "amber",
    badges: ["JLPT N1", "± 10.000 kata · 2.000 kanji"],
    canDo:
      "Membaca novel dan koran, mengikuti rapat bisnis, dan menonton anime tanpa subtitle.",
    difficulty: {
      ...JA_BASE,
      xpMult: 2.25,
      rates: [1, 1.15],
      transcript: false,
      hints: "none",
      orderDistractors: 4,
      listenPass: 0.9,
      romaji: false,
      furigana: "tap",
      mix: { meaning: 0, reverse: 2, cloze: 4, order: 3, listen: 4, grammar: 1 },
      unitQuestions: 15,
      levelQuestions: 22,
    },
  },
];

export const COURSES: Record<Lang, Course> = {
  en: {
    lang: "en",
    code: "EN",
    name: "Bahasa Inggris",
    speech: "en-US",
    colors: ["#6C63FF", "#7DD3FC"],
    levels: EN_LEVELS,
  },
  ja: {
    lang: "ja",
    code: "JA",
    name: "Bahasa Jepang",
    speech: "ja-JP",
    colors: ["#fb7185", "#fda4af"],
    levels: JA_LEVELS,
  },
};

export const COURSE_LIST: Course[] = [COURSES.en, COURSES.ja];

/** Kompatibilitas: tingkat kursus bahasa Inggris. */
export const LEVELS = EN_LEVELS;

// ---- tujuan & minat (personalisasi) ----

export const GOALS = {
  karier: "Karier",
  ielts: "IELTS/TOEFL",
  studi: "Studi & beasiswa",
  travel: "Traveling",
  jlpt: "JLPT",
  budaya: "Anime & budaya",
} as const;

export const INTERESTS = {
  teknologi: "Teknologi",
  bisnis: "Bisnis",
  desain: "Desain",
  sains: "Sains & berita",
} as const;

export const TAG_LABEL: Record<string, string> = { ...GOALS, ...INTERESTS };

// ---- kursus ----

export function levelsOf(lang: Lang): Level[] {
  return COURSES[lang].levels;
}

export function langOf(u: Unit): Lang {
  return u.language === "ja" ? "ja" : "en";
}

/** Kursus aktif = bahasa unit yang sedang dibuka. */
export function activeLang(p: Progress): Lang {
  return langOf(getUnit(p.settings.unitId));
}

export function unitsOfCourse(lang: Lang): Unit[] {
  return UNITS.filter((u) => langOf(u) === lang);
}

/** Cari tingkat berdasarkan id di semua kursus. */
export function findLevel(
  id: string,
): { lang: Lang; idx: number; level: Level } | null {
  for (const c of COURSE_LIST) {
    const idx = c.levels.findIndex((l) => l.id === id);
    if (idx >= 0) return { lang: c.lang, idx, level: c.levels[idx] };
  }
  return null;
}

// ---- unit & tingkat ----

export function levelOfUnit(u: Unit): number {
  const i = levelsOf(langOf(u)).findIndex((l) => l.cefr === u.level);
  return i < 0 ? 0 : i;
}

export function levelOfUnitObj(u: Unit): Level {
  return levelsOf(langOf(u))[levelOfUnit(u)];
}

export function unitsOfLevel(li: number, lang: Lang): Unit[] {
  return unitsOfCourse(lang).filter((u) => levelOfUnit(u) === li);
}

/** Tingkat aktif = tingkat pertama yang ujiannya belum lulus. */
export function currentLevel(p: Progress, lang: Lang = activeLang(p)): number {
  const levels = levelsOf(lang);
  const i = levels.findIndex((l) => !p.path.passedLevels[l.id]);
  return i < 0 ? levels.length - 1 : i;
}

export function allLevelsPassed(
  p: Progress,
  lang: Lang = activeLang(p),
): boolean {
  return levelsOf(lang).every((l) => p.path.passedLevels[l.id]);
}

export function unitUnlocked(p: Progress, u: Unit): boolean {
  const lang = langOf(u);
  const li = levelOfUnit(u);
  const cur = currentLevel(p, lang);
  if (li < cur || allLevelsPassed(p, lang)) return true;
  if (li > cur) return false;
  const list = unitsOfLevel(li, lang);
  const i = list.findIndex((x) => x.id === u.id);
  return i <= 0 || !!p.path.passedUnits[list[i - 1].id];
}

export function unitPassed(p: Progress, u: Unit): boolean {
  return !!p.path.passedUnits[u.id];
}

export function levelReadyForExam(
  p: Progress,
  li: number,
  lang: Lang = activeLang(p),
): boolean {
  const list = unitsOfLevel(li, lang);
  return list.length > 0 && list.every((u) => p.path.passedUnits[u.id]);
}

/** Kesulitan latihan mengikuti tingkat unit yang sedang dibuka. */
export function difficultyOf(unit: Unit): Difficulty {
  return levelOfUnitObj(unit).difficulty;
}

export function xpMultiplierFor(unitId: string): number {
  return difficultyOf(getUnit(unitId)).xpMult;
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

/** Unit yang sebaiknya dikerjakan sekarang di sebuah kursus. */
export function frontierUnit(p: Progress, lang: Lang = activeLang(p)): Unit {
  const list = unitsOfCourse(lang);
  return (
    list.find((u) => unitUnlocked(p, u) && !unitPassed(p, u)) ??
    list[list.length - 1]
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
