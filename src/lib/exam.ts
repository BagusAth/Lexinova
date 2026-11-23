// Generator soal ujian dari materi unit. Tidak butuh materi tambahan:
// soal dibuat dari kartu fondasi (items) dan poin grammar, dengan bobot jenis
// soal mengikuti tingkat kesulitan (lihat Difficulty.mix di levels.ts).

import { allItems } from "./content";
import type { Difficulty, QKind } from "./levels";
import { compareWords, fuzzyContains, normalize, words } from "./text";
import type { GrammarPoint, Item, Unit } from "./types";

export type ExamQ =
  | {
      kind: "choice";
      tag: string;
      prompt: string;
      sentence?: string;
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
      prompt: string; // terjemahan Indonesia
      target: string;
      tiles: string[];
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

/** Ambil n pengecoh unik (berdasarkan teks ternormalisasi) yang berbeda dari jawaban. */
function distractors(
  answer: string,
  candidates: string[],
  n: number,
  rng: Rng,
): string[] {
  const seen = new Set([normalize(answer)]);
  const out: string[] = [];
  for (const c of shuffle(candidates, rng)) {
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
  extra: { sentence?: string; explain?: string } = {},
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

export function buildExam(
  units: Unit[],
  diff: Difficulty,
  count: number,
  rng: Rng = Math.random,
): ExamQ[] {
  const items = units.flatMap((u) => u.items);
  const grammar = units.flatMap((u) => u.grammar);
  const pool = allItems();
  const kinds = plan(diff.mix, count, grammar.length > 0, rng);

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

  return kinds.map((kind): ExamQ => {
    if (kind === "grammar") {
      const g = nextGrammar();
      return choice(
        "Tata bahasa",
        "Pilih kalimat yang benar",
        g.common_mistake.right,
        [g.common_mistake.wrong],
        rng,
        { explain: `${g.title}. ${g.explanation}` },
      );
    }

    const it = nextItem();
    const others = pool.filter((x) => x.id !== it.id);
    const sameType = others.filter((x) => x.type === it.type);
    const prefer = (f: (x: Item) => string) => [
      ...sameType.map(f),
      ...others.map(f),
    ];

    switch (kind) {
      case "meaning":
        return choice(
          "Arti",
          `Apa arti "${it.term}"?`,
          it.meaning,
          distractors(it.meaning, prefer((x) => x.meaning), 3, rng),
          rng,
          { sentence: it.example },
        );
      case "reverse":
        return choice(
          "Padanan",
          `Bahasa Inggrisnya "${it.meaning}"`,
          it.term,
          distractors(it.term, prefer((x) => x.term), 3, rng),
          rng,
          { explain: it.note },
        );
      case "cloze":
        if (diff.clozeChoices)
          return choice(
            "Isi celah",
            "Lengkapi kalimatnya",
            it.answer,
            distractors(it.answer, prefer((x) => x.answer), 3, rng),
            rng,
            { sentence: it.cloze, explain: it.note },
          );
        return {
          kind: "type",
          tag: "Isi celah",
          prompt: it.example_id,
          sentence: it.cloze,
          answer: it.answer,
          full: it.example,
        };
      case "order": {
        const tiles = it.example.split(/\s+/);
        const own = new Set(words(it.example));
        const extra = distractors(
          "",
          others
            .flatMap((x) => x.example.split(/\s+/))
            .filter((w) => !own.has(normalize(w))),
          diff.orderDistractors,
          rng,
        );
        let mixed = shuffle([...tiles, ...extra], rng);
        if (mixed.join(" ") === it.example) mixed = shuffle(mixed, rng);
        return {
          kind: "order",
          tag: "Susun kalimat",
          prompt: it.example_id,
          target: it.example,
          tiles: mixed,
        };
      }
      case "listen":
        return {
          kind: "listen",
          tag: "Dengar & ketik",
          text: it.example,
          translation: it.example_id,
        };
    }
  });
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

export function checkOrder(picked: string[], target: string): boolean {
  return normalize(picked.join(" ")) === normalize(target);
}

export function checkListen(input: string, text: string, pass: number) {
  const r = compareWords(text, input);
  return { ...r, ok: r.total > 0 && r.correct / r.total >= pass };
}
