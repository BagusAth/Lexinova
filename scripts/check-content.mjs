// Validasi semua file materi di content/<bahasa>/unit-XX.json.
// Jalankan: npm run check:content
// Keluar dengan kode 1 bila ada kesalahan, supaya materi rusak tidak lolos.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const LEVELS = ["B1", "B1+", "B2", "B2+", "C1"];
const TAGS = ["karier", "ielts", "studi", "travel", "teknologi", "bisnis", "desain", "sains"];
const TYPES = ["word", "phrasal_verb", "collocation", "idiom", "pattern"];
const VOICES = ["en-US", "en-GB", "en-AU"];

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
  if (!LEVELS.includes(u.level)) err(name, `level "${u.level}" tidak dikenal`);
  for (const t of u.tags ?? []) if (!TAGS.includes(t)) err(name, `tag "${t}" tidak dikenal`);
  for (const k of ["items", "grammar", "listening", "reading", "writing", "speaking", "conversation"])
    if (!Array.isArray(u[k]) || !u[k].length) err(name, `bagian "${k}" kosong`);

  // items
  const terms = new Set();
  for (const it of u.items ?? []) {
    own(it.id, "item");
    if (!TYPES.includes(it.type)) err(name, `${it.id}: type "${it.type}" tidak dikenal`);
    for (const k of ["term", "meaning", "example", "example_id", "cloze", "answer"])
      if (!it[k]) err(name, `${it.id}: "${k}" kosong`);
    if ((it.cloze ?? "").split("____").length !== 2)
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
      const esc = g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\b${esc}\\b`, "i").test(r.text)) err(name, `${r.id}: glosarium "${g.term}" tidak muncul di teks`);
      if (g.item_id && !allItemIds.has(g.item_id)) err(name, `${r.id}: item_id "${g.item_id}" tidak ada`);
    }
    checkQuestions(name, r.id, r.questions);
  }

  // writing
  for (const w of u.writing ?? []) {
    own(w.id, "writing");
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
const order = units.map(({ u }) => LEVELS.indexOf(u.level));
for (let i = 1; i < order.length; i++)
  if (order[i] < order[i - 1]) warn(units[i].u.id, "tingkat unit ini lebih rendah dari unit sebelumnya (cek urutan file)");

const perLevel = Object.fromEntries(LEVELS.map((l) => [l, units.filter(({ u }) => u.level === l).length]));
console.log(`${units.length} unit · ${allItemIds.size} kartu · per tingkat: ${LEVELS.map((l) => `${l}=${perLevel[l]}`).join(" ")}`);
for (const w of warnings) console.log(`peringatan  ${w}`);
for (const e of errors) console.log(`KESALAHAN   ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} kesalahan.`);
  process.exit(1);
}
console.log("Materi valid.");
