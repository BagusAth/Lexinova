// Utilitas teks: normalisasi, perbandingan kata per kata, dan fuzzy match.
// Teks Jepang (tanpa spasi) dibandingkan per karakter; katakana disamakan
// dengan hiragana, dan bacaan kana juga dicoba supaya jawaban kana tetap benar.

import { isJaMarkup, normalizeJa, normalizeJaReading, plain } from "./ja";

export function normalize(s: string): string {
  if (isJaMarkup(s)) return normalizeJa(s);
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(s: string): string[] {
  const n = normalize(s);
  if (isJaMarkup(s)) return [...n];
  return n ? n.split(" ") : [];
}

export function countWords(s: string): number {
  // Bahasa Jepang tidak berspasi: kira-kira 2 karakter per kata.
  if (isJaMarkup(s)) return Math.ceil(normalizeJa(s).length / 2);
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export type DiffToken = { word: string; ok: boolean };

/**
 * Bandingkan jawaban dengan target memakai LCS. Hasil: tiap kata target
 * ditandai benar (ada di jawaban, urutannya sesuai) atau terlewat/salah.
 */
export function compareWords(
  target: string,
  attempt: string,
): { tokens: DiffToken[]; correct: number; total: number } {
  if (isJaMarkup(target)) {
    // Bandingkan dengan tulisan asli (kanji) dan dengan bacaan kana; ambil yang terbaik.
    const a = [...normalizeJa(attempt)];
    const bySurface = lcsTokens([...normalizeJa(target)], a);
    const byReading = lcsTokens([...normalizeJaReading(target)], a);
    const best =
      byReading.correct / byReading.total > bySurface.correct / bySurface.total
        ? byReading
        : bySurface;
    return best;
  }
  return lcsTokens(words(target), words(attempt));
}

function lcsTokens(
  t: string[],
  a: string[],
): { tokens: DiffToken[]; correct: number; total: number } {
  const dp: number[][] = Array.from({ length: t.length + 1 }, () =>
    new Array(a.length + 1).fill(0),
  );
  for (let i = t.length - 1; i >= 0; i--)
    for (let j = a.length - 1; j >= 0; j--)
      dp[i][j] =
        t[i] === a[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < t.length) {
    if (j < a.length && t[i] === a[j]) {
      tokens.push({ word: t[i], ok: true });
      i++;
      j++;
    } else if (j < a.length && dp[i][j + 1] >= dp[i + 1][j]) {
      j++;
    } else {
      tokens.push({ word: t[i], ok: false });
      i++;
    }
  }
  const correct = tokens.filter((x) => x.ok).length;
  return { tokens, correct, total: t.length };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = cur;
  }
  return prev[n];
}

/** Apakah frasa kunci muncul di jawaban, dengan toleransi salah ketik kecil per kata. */
export function fuzzyContains(answer: string, phrase: string): boolean {
  if (isJaMarkup(phrase) || isJaMarkup(answer))
    return normalizeJa(answer).includes(normalizeJa(phrase));
  const a = words(answer);
  const p = words(phrase);
  if (!p.length) return false;
  for (let start = 0; start + p.length <= a.length; start++) {
    let ok = true;
    for (let k = 0; k < p.length; k++) {
      const x = a[start + k];
      const y = p[k];
      const tol = y.length <= 3 ? 0 : y.length <= 6 ? 1 : 2;
      if (levenshtein(x, y) > tol) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/** Cocokkan jawaban bebas dengan teks cloze, toleran terhadap huruf besar dan tanda baca. */
export function sameAnswer(a: string, b: string): boolean {
  if (isJaMarkup(a) || isJaMarkup(b))
    return (
      normalizeJa(a) === normalizeJa(b) ||
      normalizeJa(a) === normalizeJaReading(b) ||
      normalizeJaReading(a) === normalizeJa(b)
    );
  return normalize(a) === normalize(b);
}

/** Teks untuk ditampilkan tanpa markup (mis. di notifikasi). */
export function display(s: string): string {
  return isJaMarkup(s) ? plain(s) : s;
}
