// Validasi semua file materi di content/<bahasa>/unit-XX.json.
// Jalankan: npm run check:content
// Keluar dengan kode 1 bila ada kesalahan, supaya materi rusak tidak lolos.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const LEVELS_BY_LANG = {
  en: ["B1", "B1+", "B2", "B2+", "C1"],
  ja: ["Kana", "N5", "N4", "N3", "N2", "N1"],
};
const TAGS = ["karier", "ielts", "studi", "travel", "jlpt", "budaya", "teknologi", "bisnis", "desain", "sains"];
const TYPES = ["word", "phrasal_verb", "collocation", "idiom", "pattern", "kana"];
const VOICES = ["en-US", "en-GB", "en-AU", "ja-JP"];

// --- markup Jepang: token dipisah spasi, kanji ditulis {漢字|かな} ---
const RUBY = /\{([^|{}]+)\|([^{}]+)\}/g;
const plainJa = (s) => s.replace(RUBY, "$1").replace(/ +/g, "");
const normJa = (s) =>
  plainJa(s)
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s。、！？「」『』（）・…〜!?.,"'：:]/g, "");
/** Markup ruby rusak? (kurung atau | yang tersisa setelah ruby valid dihapus) */
const badRuby = (s) => /[{}|]/.test(s.replace(RUBY, ""));
const tokensJa = (s) => s.split(/ +/).filter(Boolean);
const PUNCT_JA = /^[。、！？「」『』（）・…〜!?.,]+$/;

const errors = [];
const warnings = [];
const err = (u, m) => errors.push(`${u}: ${m}`);
const warn = (u, m) => warnings.push(`${u}: ${m}`);
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function checkQuestions(u, where, qs) {
  if (!Array.isArray(qs) || qs.length === 0) return err(u, `${where}: tidak ada soal`);
  qs.forEach((q, i) => {
    if (!q.q || !Array.isArray(q.options) || q.options.length < 2)
      err(u, `${where} soal ${i + 1}: pertanyaan/pilihan kosong`);
    if (!(q.answer >= 0 && q.answer < q.options.length))
      err(u, `${where} soal ${i + 1}: indeks jawaban di luar pilihan`);
    if (new Set(q.options).size !== q.options.length)
      err(u, `${where} soal ${i + 1}: pilihan ganda kembar`);
  });
}

const files = [];
for (const lang of readdirSync(join(ROOT, "content"), { withFileTypes: true })) {
  if (!lang.isDirectory()) continue;
  for (const f of readdirSync(join(ROOT, "content", lang.name)))
    if (/^unit-\d+\.json$/.test(f)) files.push(join("content", lang.name, f));
}
files.sort();

const units = files.map((f) => {
  try {
    return { file: f, u: JSON.parse(readFileSync(join(ROOT, f), "utf8")) };
  } catch (e) {
    err(f, `JSON tidak valid: ${e.message}`);
    return null;
  }
}).filter(Boolean);

const allIds = new Map();
const allItemIds = new Set(units.flatMap(({ u }) => (u.items ?? []).map((i) => i.id)));

for (const { file, u } of units) {
  const name = u.id ?? file;
  const own = (id, where) => {
    if (allIds.has(id)) err(name, `id ganda "${id}" (${where}, juga di ${allIds.get(id)})`);
    allIds.set(id, name);
    if (!id.startsWith(`${u.id}-`)) err(name, `id "${id}" tidak diawali "${u.id}-"`);
  };

  for (const k of ["id", "language", "level", "title", "theme"])
    if (!u[k]) err(name, `kolom "${k}" kosong`);
  const LEVELS = LEVELS_BY_LANG[u.language];
  if (!LEVELS) err(name, `bahasa "${u.language}" tidak dikenal`);
  else if (!LEVELS.includes(u.level)) err(name, `level "${u.level}" tidak dikenal untuk bahasa ${u.language}`);
  const ja = u.language === "ja";
  // Semua teks Jepang di unit ini harus punya markup ruby yang valid.
  if (ja) {
    const walk = (v, path) => {
      if (typeof v === "string") {
        if (badRuby(v)) err(name, `markup ruby rusak di ${path}: "${v}"`);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    walk(u, u.id);
  }
  for (const t of u.tags ?? []) if (!TAGS.includes(t)) err(name, `tag "${t}" tidak dikenal`);
  for (const k of ["items", "grammar", "listening", "reading", "writing", "speaking", "conversation"])
    if (!Array.isArray(u[k]) || !u[k].length) err(name, `bagian "${k}" kosong`);

  // items
  const terms = new Set();
  for (const it of u.items ?? []) {
    own(it.id, "item");
    if (!TYPES.includes(it.type)) err(name, `${it.id}: type "${it.type}" tidak dikenal`);
    const needCloze = it.type !== "kana";
    for (const k of ["term", "meaning", "example", "example_id", ...(needCloze ? ["cloze", "answer"] : [])])
      if (!it[k]) err(name, `${it.id}: "${k}" kosong`);
    if (!needCloze && !it.cloze) {
      // Item huruf kana: cukup huruf, bunyi (romaji), dan kata contoh.
    } else if ((it.cloze ?? "").split("____").length !== 2)
      err(name, `${it.id}: cloze harus berisi tepat satu ____`);
    else if (it.cloze.replace("____", it.answer) !== it.example)
      err(name, `${it.id}: cloze + answer ≠ example\n    "${it.cloze.replace("____", it.answer)}"\n    "${it.example}"`);
    if (terms.has(it.term.toLowerCase())) err(name, `${it.id}: term ganda "${it.term}"`);
    terms.add(it.term.toLowerCase());
  }
  if ((u.items ?? []).length < 10) warn(name, `hanya ${(u.items ?? []).length} item (disarankan 12)`);

  // grammar
  for (const g of u.grammar ?? []) {
    own(g.id, "grammar");
    if (!g.title || !g.explanation || !g.examples?.length) err(name, `${g.id}: isi grammar belum lengkap`);
    if (!g.common_mistake?.wrong || !g.common_mistake?.right || g.common_mistake.wrong === g.common_mistake.right)
      err(name, `${g.id}: common_mistake wrong/right tidak valid`);
  }

  // listening
  for (const l of u.listening ?? []) {
    own(l.id, "listening");
    const names = new Set((l.speakers ?? []).map((s) => s.name));
    for (const s of l.speakers ?? []) if (!VOICES.includes(s.voice)) err(name, `${l.id}: suara "${s.voice}" tidak dikenal`);
    l.lines?.forEach((ln, i) => {
      if (!names.has(ln.speaker)) err(name, `${l.id}: baris ${i} pembicara "${ln.speaker}" tidak ada di speakers`);
    });
    for (const d of l.dictation ?? [])
      if (!(d >= 0 && d < l.lines.length)) err(name, `${l.id}: indeks dikte ${d} di luar baris`);
    checkQuestions(name, l.id, l.questions);
  }

  // reading
  for (const r of u.reading ?? []) {
    own(r.id, "reading");
    for (const g of r.glossary ?? []) {
      if (ja) {
        // Glosarium Jepang dicocokkan per token (bisa diketuk di halaman Reading).
        const want = normJa(g.term);
        if (!tokensJa(r.text).some((t) => normJa(t) === want))
          err(name, `${r.id}: glosarium "${g.term}" bukan salah satu token teks`);
        if (g.item_id && !allItemIds.has(g.item_id)) err(name, `${r.id}: item_id "${g.item_id}" tidak ada`);
        continue;
      }
      const esc = g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\b${esc}\\b`, "i").test(r.text)) err(name, `${r.id}: glosarium "${g.term}" tidak muncul di teks`);
      if (g.item_id && !allItemIds.has(g.item_id)) err(name, `${r.id}: item_id "${g.item_id}" tidak ada`);
    }
    checkQuestions(name, r.id, r.questions);
  }

  // writing
  for (const w of u.writing ?? []) {
    own(w.id, "writing");
    if (w.mode === "build") {
      if (!w.sentences?.length) err(name, `${w.id}: kalimat susun kosong`);
      for (const s of w.sentences ?? []) {
        if (!s.id || !s.ja) err(name, `${w.id}: kalimat susun belum lengkap`);
        else if (tokensJa(s.ja).filter((t) => !PUNCT_JA.test(t)).length < 2)
          err(name, `${w.id}: "${s.ja}" perlu minimal 2 ubin (pisahkan token dengan spasi)`);
      }
      continue;
    }
    if (!(w.min_words > 0 && w.max_words > w.min_words)) err(name, `${w.id}: rentang kata tidak valid`);
    const n = words(w.model_answer ?? "");
    if (n < w.min_words || n > w.max_words)
      err(name, `${w.id}: contoh jawaban ${n} kata, di luar ${w.min_words}–${w.max_words}`);
    if (!w.checklist?.length) err(name, `${w.id}: checklist kosong`);
  }

  // speaking
  for (const s of u.speaking ?? []) {
    own(s.id, "speaking");
    if (s.mode === "shadowing") {
      if (!s.sentences?.length) err(name, `${s.id}: kalimat shadowing kosong`);
    } else if (s.mode === "answer") {
      if (!s.prompt || !s.sample_answer) err(name, `${s.id}: prompt/sample_answer kosong`);
    } else err(name, `${s.id}: mode "${s.mode}" tidak dikenal`);
  }

  // conversation
  for (const c of u.conversation ?? []) {
    own(c.id, "conversation");
    const nodes = c.nodes ?? {};
    if (!nodes[c.start]) err(name, `${c.id}: start "${c.start}" tidak ada`);
    const seen = new Set();
    const stack = [c.start];
    let reachesEnd = false;
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id) || !nodes[id]) continue;
      seen.add(id);
      const n = nodes[id];
      if (n.end) { reachesEnd = true; continue; }
      if (n.choices) {
        if (!n.choices.some((ch) => ch.ok !== false)) err(name, `${c.id}/${id}: tidak ada pilihan yang benar`);
        for (const ch of n.choices) {
          if (!nodes[ch.next]) err(name, `${c.id}/${id}: pilihan "${ch.text}" menuju "${ch.next}" yang tidak ada`);
          if (ch.ok === false && !ch.feedback) err(name, `${c.id}/${id}: pilihan salah "${ch.text}" perlu feedback`);
          stack.push(ch.next);
        }
        continue;
      }
      if (!n.fallback) err(name, `${c.id}/${id}: tanpa fallback (dialog bisa macet)`);
      for (const r of n.replies ?? []) {
        if (!nodes[r.next]) err(name, `${c.id}/${id}: next "${r.next}" tidak ada`);
        if (!r.match?.length) err(name, `${c.id}/${id}: match kosong`);
        stack.push(r.next);
      }
      if (n.fallback) {
        if (!nodes[n.fallback.next]) err(name, `${c.id}/${id}: fallback "${n.fallback.next}" tidak ada`);
        stack.push(n.fallback.next);
      }
    }
    if (!reachesEnd) err(name, `${c.id}: tidak ada jalan ke node akhir`);
    for (const id of Object.keys(nodes)) if (!seen.has(id)) warn(name, `${c.id}/${id}: node tidak pernah dicapai`);
  }
}

// Semua unit harus didaftarkan di content.ts, berurutan sesuai tingkat.
const contentTs = readFileSync(join(ROOT, "src/lib/content.ts"), "utf8");
for (const { file } of units) {
  const rel = file.replace(/\\/g, "/").replace(/^content\//, "@content/");
  if (!contentTs.includes(rel)) err(file, `belum diimpor di src/lib/content.ts`);
}
for (const [lang, LEVELS] of Object.entries(LEVELS_BY_LANG)) {
  const list = units.filter(({ u }) => u.language === lang);
  const order = list.map(({ u }) => LEVELS.indexOf(u.level));
  for (let i = 1; i < order.length; i++)
    if (order[i] < order[i - 1]) warn(list[i].u.id, "tingkat unit ini lebih rendah dari unit sebelumnya (cek urutan file)");
  const cards = list.reduce((a, { u }) => a + (u.items?.length ?? 0), 0);
  console.log(`${lang.toUpperCase()}: ${list.length} unit · ${cards} kartu · ${LEVELS.map((l) => `${l}=${list.filter(({ u }) => u.level === l).length}`).join(" ")}`);
}
for (const w of warnings) console.log(`peringatan  ${w}`);
for (const e of errors) console.log(`KESALAHAN   ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} kesalahan.`);
  process.exit(1);
}
console.log("Materi valid.");
