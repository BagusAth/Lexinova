// Generator soal ujian dari materi unit. Tidak butuh materi tambahan:
// soal dibuat dari kartu fondasi (items) dan poin grammar, dengan bobot jenis
// soal mengikuti tingkat kesulitan (lihat Difficulty.mix di levels.ts).
//
// Bahasa Jepang memakai gaya Duolingo tanpa keyboard Jepang:
// isi celah berupa pilihan, soal dengar berupa "susun ubin" atau "pilih huruf",
// dan ubin kata ditampilkan dengan furigana.

import { allItems } from "./content";
import { isJaMarkup, plain, tileTokens } from "./ja";
import type { Difficulty, QKind } from "./levels";
import { compareWords, fuzzyContains, normalize, words } from "./text";
import type { GrammarPoint, Item, Unit } from "./types";

export type ExamQ =
  | {
      kind: "choice";
      tag: string;
      prompt: string;
      /** Teks yang ditanyakan, ditampilkan besar (istilah atau arti). */
      focus?: string;
      sentence?: string;
      /** Diputar otomatis (soal "pilih yang kamu dengar"). */
      audio?: string;
      options: string[];
      answer: number;
      explain?: string;
    }
  | {
      kind: "type";
      tag: string;
      prompt: string;
      sentence: string; // dengan ____
      answer: string;
      full: string;
    }
  | {
      kind: "order";
      tag: string;
      prompt: string; // terjemahan Indonesia, atau instruksi untuk soal dengar
      target: string;
      tiles: string[];
      /** Diputar otomatis (soal "susun yang kamu dengar"). */
      audio?: string;
      translation?: string;
    }
  | {
      kind: "listen";
      tag: string;
      text: string;
      translation: string;
    };

type Rng = () => number;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Ambil n pengecoh unik (berdasarkan teks ternormalisasi) yang berbeda dari jawaban.
 * Dengan `keepOrder`, urutan kandidat dipertahankan (sudah diacak per kelompok
 * prioritas oleh pemanggil), supaya pengecoh sejenis didahulukan.
 */
function distractors(
  answer: string,
  candidates: string[],
  n: number,
  rng: Rng,
  keepOrder = false,
): string[] {
  const seen = new Set([normalize(answer)]);
  const out: string[] = [];
  for (const c of keepOrder ? candidates : shuffle(candidates, rng)) {
    if (out.length >= n) break;
    const k = normalize(c);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

function choice(
  tag: string,
  prompt: string,
  correct: string,
  wrong: string[],
  rng: Rng,
  extra: {
    focus?: string;
    sentence?: string;
    explain?: string;
    audio?: string;
  } = {},
): ExamQ {
  const options = shuffle([correct, ...wrong], rng);
  return {
    kind: "choice",
    tag,
    prompt,
    options,
    answer: options.indexOf(correct),
    ...extra,
  };
}

/** Bagi jumlah soal sesuai bobot, lalu acak urutannya. */
function plan(
  mix: Record<QKind, number>,
  count: number,
  hasGrammar: boolean,
  rng: Rng,
): QKind[] {
  const kinds = (Object.keys(mix) as QKind[]).filter(
    (k) => mix[k] > 0 && (k !== "grammar" || hasGrammar),
  );
  const total = kinds.reduce((a, k) => a + mix[k], 0);
  const exact = kinds.map((k) => ({ k, v: (mix[k] / total) * count }));
  const out: QKind[] = [];
  for (const e of exact) for (let i = 0; i < Math.floor(e.v); i++) out.push(e.k);
  // Sisa dibagi ke pecahan terbesar.
  const rest = [...exact].sort((a, b) => (b.v % 1) - (a.v % 1));
  for (let i = 0; out.length < count; i++) out.push(rest[i % rest.length].k);
  return shuffle(out, rng);
}

/** Token ubin: Jepang memakai token markup, Inggris dipisah spasi. */
function tilesOf(sentence: string): string[] {
  return isJaMarkup(sentence) ? tileTokens(sentence) : sentence.split(/\s+/);
}

export function buildExam(
  units: Unit[],
  diff: Difficulty,
  count: number,
  rng: Rng = Math.random,
): ExamQ[] {
  const items = units.flatMap((u) => u.items);
  const grammar = units.flatMap((u) => u.grammar);
  const lang = units[0]?.language ?? "en";
  // Pengecoh hanya dari kursus yang sama (kata Inggris tidak muncul di ujian Jepang).
  const pool = allItems().filter((i) => i.id.startsWith(`${lang}-`));
  const kinds = plan(diff.mix, count, grammar.length > 0, rng);
  // Unit huruf (kana): soal tata bahasa berupa memilih penulisan yang benar.
  const kanaLevel = items.length > 0 && items.every((i) => i.type === "kana");

  let itemQueue: Item[] = [];
  const nextItem = () => {
    if (!itemQueue.length) itemQueue = shuffle(items, rng);
    return itemQueue.pop()!;
  };
  let gQueue: GrammarPoint[] = [];
  const nextGrammar = () => {
    if (!gQueue.length) gQueue = shuffle(grammar, rng);
    return gQueue.pop()!;
  };

  return kinds.map((planned): ExamQ => {
    if (planned === "grammar") {
      const g = nextGrammar();
      return choice(
        kanaLevel ? "Penulisan" : "Tata bahasa",
        kanaLevel ? "Pilih penulisan yang benar" : "Pilih kalimat yang benar",
        g.common_mistake.right,
        [g.common_mistake.wrong],
        rng,
        { explain: `${g.title}. ${g.explanation}` },
      );
    }

    const it = nextItem();
    const isKana = it.type === "kana";
    // Item huruf kana tidak punya kalimat untuk isi celah/susun kata.
    let kind: QKind = planned;
    if (isKana && kind === "cloze") kind = "reverse";
    if (isKana && kind === "order") kind = "listen";
    if (kind === "cloze" && !(it.cloze && it.answer)) kind = "meaning";

    // Huruf kana hanya diadu dengan huruf kana; kata biasa tidak pernah diadu dengan huruf.
    const others = pool.filter(
      (x) => x.id !== it.id && (x.type === "kana") === isKana,
    );
    const sameType = others.filter((x) => x.type === it.type);
    const rest = others.filter((x) => x.type !== it.type);
    /** Kandidat pengecoh: yang sejenis dulu (diacak), lalu sisanya (diacak). */
    const prefer = (f: (x: Item) => string) => [
      ...shuffle(sameType, rng).map(f),
      ...shuffle(rest, rng).map(f),
    ];
    // Pengecoh huruf: dari aksara yang sama (hiragana/katakana) dan bunyinya
    // berbeda, supaya tidak ada dua jawaban benar (mis. お dan を = "o", あ dan ア = "a").
    const kanaPeers = others
      .filter(
        (x) =>
          x.type === "kana" &&
          x.id.split("-i")[0] === it.id.split("-i")[0] &&
          x.meaning !== it.meaning,
      )
      .map((x) => x.term);

    switch (kind) {
      case "meaning":
        return choice(
          isKana ? "Bunyi" : "Arti",
          isKana ? "Bagaimana bunyi huruf ini?" : "Apa artinya?",
          it.meaning,
          distractors(it.meaning, prefer((x) => x.meaning), 3, rng, true),
          rng,
          { focus: it.term, sentence: isKana ? undefined : it.example },
        );
      case "reverse":
        return choice(
          isKana ? "Huruf" : "Padanan",
          isKana ? "Pilih huruf untuk bunyi ini" : "Pilih padanannya",
          it.term,
          distractors(it.term, isKana ? shuffle(kanaPeers, rng) : prefer((x) => x.term), 3, rng, true),
          rng,
          { focus: it.meaning, explain: it.note },
        );
      case "cloze":
        if (diff.clozeChoices)
          return choice(
            "Isi celah",
            // Terjemahan ditampilkan supaya jawabannya tidak ambigu.
            `Lengkapi kalimatnya · “${it.example_id}”`,
            it.answer!,
            distractors(it.answer!, prefer((x) => x.answer ?? ""), 3, rng, true),
            rng,
            { sentence: it.cloze, explain: it.note },
          );
        return {
          kind: "type",
          tag: "Isi celah",
          prompt: it.example_id,
          sentence: it.cloze!,
          answer: it.answer!,
          full: it.example,
        };
      case "order":
        return orderQ(it, others, diff, rng);
      case "listen":
        if (isKana)
          // "Pilih yang kamu dengar": huruf kana diputar, pilih hurufnya.
          return choice(
            "Dengar",
            "Pilih huruf yang kamu dengar",
            it.term,
            distractors(it.term, kanaPeers, 3, rng),
            rng,
            { audio: it.term },
          );
        if (diff.listenMode === "tiles")
          return {
            ...orderQ(it, others, diff, rng),
            tag: "Dengar & susun",
            prompt: "Susun kalimat yang kamu dengar",
            audio: it.example,
            translation: it.example_id,
          } as ExamQ;
        return {
          kind: "listen",
          tag: "Dengar & ketik",
          text: it.example,
          translation: it.example_id,
        };
    }
    // Tidak tercapai: semua jenis sudah ditangani di atas.
    return orderQ(it, others, diff, rng);
  });
}

function orderQ(it: Item, others: Item[], diff: Difficulty, rng: Rng): ExamQ {
  const tiles = tilesOf(it.example);
  const own = new Set(tiles.map((t) => normalize(t)));
  const extra = distractors(
    "",
    others
      .flatMap((x) => tilesOf(x.example))
      .filter((w) => !own.has(normalize(w))),
    diff.orderDistractors,
    rng,
  );
  let mixed = shuffle([...tiles, ...extra], rng);
  if (mixed.join(" ") === tiles.join(" ")) mixed = shuffle(mixed, rng);
  return {
    kind: "order",
    tag: "Susun kalimat",
    prompt: it.example_id,
    target: it.example,
    tiles: mixed,
  };
}

// ---- penilaian ----

/** Isian dianggap benar bila sama persis atau hanya salah ketik kecil. */
export function checkTyped(input: string, answer: string): {
  ok: boolean;
  typo: boolean;
} {
  if (normalize(input) === normalize(answer)) return { ok: true, typo: false };
  const typo =
    words(input).length === words(answer).length &&
    fuzzyContains(input, answer);
  return { ok: typo, typo };
}

/** Susunan ubin benar bila hasil gabungannya sama dengan kalimat target. */
export function checkOrder(picked: string[], target: string): boolean {
  // normalize() sudah menangani Jepang (tanpa spasi/markup) maupun Inggris.
  return normalize(picked.join(" ")) === normalize(target);
}

export function checkListen(input: string, text: string, pass: number) {
  const r = compareWords(text, input);
  return { ...r, ok: r.total > 0 && r.correct / r.total >= pass };
}

/** Kalimat target tanpa markup (untuk ditampilkan di umpan balik). */
export function shown(s: string): string {
  return isJaMarkup(s) ? plain(s) : s;
}
