// Utilitas teks Jepang.
//
// Markup materi Jepang (lihat content/FORMAT.md):
// - Token dipisah SPASI, supaya bisa dipakai sebagai ubin susun kalimat.
//   Spasi antar-token Jepang tidak ditampilkan (bahasa Jepang tidak memakai spasi).
// - Kanji diberi bacaan dengan {漢字|かんじ}. Contoh:
//   "{私|わたし} は {学生|がくせい} です 。"  →  私は学生です。 (watashi wa gakusei desu.)
// - Romaji dibuat otomatis dari bacaan kana, jadi tidak perlu ditulis manual.

const JP_CHAR = /[　-〿぀-ヿ㐀-鿿！-｠ー〜・]/;
const JP_LETTER = /[぀-ヿ㐀-鿿]/;
const RUBY = /\{([^|{}]+)\|([^{}]+)\}/g;
const PUNCT = /^[。、！？「」『』（）・…〜!?.,]+$/;

export function hasJapanese(s: string): boolean {
  return JP_LETTER.test(s);
}

/** Teks berisi markup Jepang (kana/kanji atau ruby)? */
export function isJaMarkup(s: string): boolean {
  return s.includes("{") || hasJapanese(s);
}

export interface Seg {
  base: string;
  ruby?: string;
}

export function parseToken(tok: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const m of tok.matchAll(RUBY)) {
    if (m.index! > last) out.push({ base: tok.slice(last, m.index) });
    out.push({ base: m[1], ruby: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < tok.length) out.push({ base: tok.slice(last) });
  return out;
}

export function splitTokens(text: string): string[] {
  return text.split(/ +/).filter(Boolean);
}

const tokenPlain = (tok: string) => tok.replace(RUBY, "$1");
const tokenReading = (tok: string) => tok.replace(RUBY, "$2");

/** Perlu spasi di antara dua token? Tidak, bila keduanya karakter Jepang. */
export function needsSpace(prev: string, next: string): boolean {
  const a = prev.at(-1) ?? "";
  const b = next[0] ?? "";
  return !(JP_CHAR.test(a) && JP_CHAR.test(b));
}

function joinWith(tokens: string[], f: (t: string) => string): string {
  let out = "";
  tokens.forEach((t, i) => {
    const s = f(t);
    if (i > 0 && needsSpace(f(tokens[i - 1]), s)) out += " ";
    out += s;
  });
  return out;
}

/** Teks tampilan tanpa markup: 私は学生です。 */
export function plain(text: string): string {
  return joinWith(splitTokens(text), tokenPlain);
}

/** Bacaan kana: わたしはがくせいです。 */
export function reading(text: string): string {
  return joinWith(splitTokens(text), tokenReading);
}

export function isPunct(tok: string): boolean {
  return PUNCT.test(tokenPlain(tok));
}

/** Token untuk ubin susun kalimat (tanpa tanda baca). Masih dalam markup. */
export function tileTokens(text: string): string[] {
  return splitTokens(text).filter((t) => !isPunct(t));
}

export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );
}

/** Untuk membandingkan jawaban: tanpa markup, spasi, dan tanda baca; katakana → hiragana. */
export function normalizeJa(s: string): string {
  return toHiragana(plain(s))
    .replace(/[\s。、！？「」『』（）・…〜!?.,"'：:]/g, "")
    .toLowerCase();
}

/** Versi bacaan (kanji diganti kana) untuk perbandingan alternatif. */
export function normalizeJaReading(s: string): string {
  return normalizeJa(reading(s));
}

// ---- kana → romaji (Hepburn) ----

const BASE: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", ゐ: "i", ゑ: "e", を: "o", ん: "n",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
  ゃ: "ya", ゅ: "yu", ょ: "yo", ゎ: "wa", ゔ: "vu",
};

// Kombinasi khusus (kebanyakan untuk kata serapan katakana).
const COMBO: Record<string, string> = {
  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo",
  てぃ: "ti", でぃ: "di", とぅ: "tu", どぅ: "du",
  うぃ: "wi", うぇ: "we", うぉ: "wo",
  しぇ: "she", ちぇ: "che", じぇ: "je", いぇ: "ye",
  ゔぁ: "va", ゔぃ: "vi", ゔぇ: "ve", ゔぉ: "vo",
};

const SMALL_Y: Record<string, string> = { ゃ: "a", ゅ: "u", ょ: "o" };

function yoon(first: string, small: string): string | null {
  const r = BASE[first];
  if (!r || !r.endsWith("i") || r.length < 2) return null;
  const v = SMALL_Y[small];
  if (r === "shi") return "sh" + v;
  if (r === "chi") return "ch" + v;
  if (r === "ji") return "j" + v;
  return r.slice(0, -1) + "y" + v;
}

export function kanaToRomaji(input: string): string {
  const s = toHiragana(input);
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const pair = s.slice(i, i + 2);
    if (c === "っ") {
      // Konsonan ganda: ambil suku kata berikutnya lalu gandakan huruf depannya.
      const next = kanaToRomaji(s.slice(i + 1, i + 3)).slice(0, 3);
      out.push(next.startsWith("ch") ? "t" : (next[0] ?? ""));
      i += 1;
      continue;
    }
    if (c === "ー") {
      const prev = out.join("");
      out.push(prev.at(-1) ?? "");
      i += 1;
      continue;
    }
    if (COMBO[pair]) {
      out.push(COMBO[pair]);
      i += 2;
      continue;
    }
    if (SMALL_Y[s[i + 1]]) {
      const y = yoon(c, s[i + 1]);
      if (y) {
        out.push(y);
        i += 2;
        continue;
      }
    }
    out.push(BASE[c] ?? c);
    i += 1;
  }
  return out.join("");
}

// Token yang berisi partikel は/へ dibaca "wa"/"e".
const PARTICLE: Record<string, string> = {
  は: "wa", へ: "e", を: "o", には: "niwa", では: "dewa", とは: "towa",
  へは: "ewa", からは: "karawa", までは: "madewa", こんにちは: "konnichiwa",
  こんばんは: "konbanwa",
};

const PUNCT_ROMAJI: Record<string, string> = {
  "。": ".", "、": ",", "？": "?", "！": "!", "「": '"', "」": '"', "〜": "~", "…": "...",
};

/** Romaji otomatis dari markup: "watashi wa gakusei desu." */
export function romaji(text: string): string {
  let out = "";
  for (const tok of splitTokens(text)) {
    const r = tokenReading(tok);
    if (isPunct(tok)) {
      out += [...tokenPlain(tok)].map((c) => PUNCT_ROMAJI[c] ?? c).join("");
      continue;
    }
    const word = hasJapanese(r)
      ? (PARTICLE[r] ?? kanaToRomaji(r).replace(/[。、？！]/g, (c) => PUNCT_ROMAJI[c]))
      : r;
    out += (out ? " " : "") + word;
  }
  return out.trim();
}
