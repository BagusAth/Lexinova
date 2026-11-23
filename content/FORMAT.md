# Format materi Lexinova

Semua materi disimpan sebagai file JSON di repo (`content/<bahasa>/unit-XX.json`). Aplikasi tidak memanggil AI; materi baru dibuat bersama Claude lewat chat, ditinjau, lalu ditambahkan sebagai file.

## Struktur satu unit

```
{
  "id": "en-u01",            // <bahasa>-u<nomor>
  "language": "en",          // en | ja (ko menyusul)
  "level": "B1",             // en: B1 | B1+ | B2 | B2+ | C1 · ja: Kana | N5 | N4 | N3 | N2 | N1
  "title": "...",            // judul unit (bahasa Indonesia)
  "theme": "...",
  "tags": ["karier", ...],   // opsional: tujuan/minat untuk personalisasi (lihat di bawah)
  "items": [...],            // kartu fondasi (masuk review FSRS)
  "grammar": [...],          // poin tata bahasa singkat
  "listening": [...],
  "reading": [...],
  "writing": [...],
  "speaking": [...],
  "conversation": [...]
}
```

## Jalur tingkat dan ujian

Unit dikelompokkan per tingkat lewat kolom `level`, berurutan sesuai array `UNITS` di `src/lib/content.ts`.
Aturan tingkat ada di `src/lib/levels.ts`.

- **Pelajaran per unit** (node di Jalur): Fondasi (`items`), Tata bahasa (`grammar`, penjelasan + cek pilih kalimat benar), Listening, Reading, Writing, Speaking, Conversation.
- **Ujian Unit**: 3 nyawa, membuka unit berikutnya di tingkat yang sama. Boleh diambil sebelum semua pelajaran selesai (lompat).
- **Ujian Naik Tingkat**: soal dari semua unit di tingkat itu. Lulus = naik tingkat dan semua unit di bawahnya ikut lulus, jadi bisa dipakai sebagai Uji Lompat.
- Soal ujian dibuat otomatis dari `items` dan `grammar` (arti, padanan, isi celah, susun kata, dengar-lalu-ketik, kalimat benar). Tidak perlu menulis soal ujian terpisah, tapi pastikan `cloze` yang diisi `answer` sama persis dengan `example`.
- Makin tinggi tingkat, makin berat: isi celah diketik (bukan pilihan), kata pengecoh di susun kata, ambang dengar lebih tinggi, audio tanpa opsi pelan, transkrip listening disembunyikan, ide jawaban conversation disembunyikan, dan XP lebih besar.

Panduan isi per tingkat:

| Tingkat | Kosakata & tata bahasa | Panjang writing | Gaya tugas |
|---|---|---|---|
| B1 | frasa kerja sehari-hari, present perfect, going to/will | 50–110 kata | email, pesan Slack |
| B1+ | pengalaman & rencana, present perfect continuous, gerund | 120–180 kata | wawancara, paragraf opini IELTS |
| B2 | argumentasi, conditional, passive, kolokasi akademik | 180–250 kata | presentasi, esai IELTS Task 2 |
| B2+ | nuansa, hedging, reported speech, idiom bisnis | 250+ kata | negosiasi, ringkasan artikel sains |
| C1 | register formal, inversion, cleft sentence | 250–300 kata | esai beasiswa, diskusi panel |

### tags

Kunci tujuan: `karier`, `ielts`, `studi`, `travel`, `jlpt`, `budaya`. Kunci minat: `teknologi`, `bisnis`, `desain`, `sains`.
Tag yang cocok dengan profil di Pengaturan disorot di halaman Jalur.

## Materi bahasa Jepang (`content/ja/`)

Kursus Jepang memakai gaya Duolingo tanpa keyboard Jepang: isi celah berupa pilihan, dikte dan writing berupa susun ubin, dan conversation berupa pilihan balasan. Tingkatnya Kana → N5 → N4 → N3 → N2 → N1 (lihat `JA_LEVELS` di `src/lib/levels.ts`).

### Markup teks Jepang

Semua teks Jepang (term, example, cloze, answer, kalimat dialog, teks bacaan, contoh grammar) memakai dua aturan:

1. **Token dipisah spasi.** Spasi tidak ditampilkan, tapi menentukan ubin di soal susun kalimat. Partikel dan tanda baca jadi token sendiri.
2. **Kanji diberi bacaan** dengan `{漢字|かんじ}`. Furigana dan romaji dibuat otomatis dari bacaan ini, jadi romaji tidak perlu ditulis.

```
"{私|わたし} は {学生|がくせい} です 。"
→ tampil: 私は学生です。 (furigana di atas kanji)
→ romaji: watashi wa gakusei desu.
→ ubin:   私 | は | 学生 | です
```

- Partikel は/へ/を otomatis dibaca wa/e/o bila berdiri sebagai token sendiri.
- Kanji yang ditulis bersama okurigana: `{行|い}きます`, `{面白|おもしろ}い`.
- Kutipan Jepang di dalam teks Indonesia ditulis tanpa spasi di dalam 「」, mis. `Apa arti 「またね」?`.
- `cloze` boleh berada di dalam token: `"お____ は ？"` dengan `answer` `"{名前|なまえ}"`.

### items jenis `kana`

Untuk unit huruf (tingkat Kana): `type: "kana"`, `term` = huruf, `meaning` = bunyinya dalam romaji, `example` = kata contoh dengan huruf itu, `example_id` = artinya. `cloze` dan `answer` tidak perlu. Ujian unit kana memakai soal bunyi, pilih huruf, dan dengar-lalu-pilih.

### writing mode `build`

```
{ "id": "...", "mode": "build", "prompt": "Terjemahkan dengan menyusun ubin kata.",
  "sentences": [ { "id": "Saya pelajar.", "ja": "{私|わたし} は {学生|がくせい} です 。" } ] }
```

Kalimat Indonesia ditampilkan, lalu kalimat Jepang disusun dari ubin (ditambah kata pengecoh sesuai tingkat). Minimal 2 ubin per kalimat.

### conversation dengan `choices`

Node boleh memakai pilihan balasan alih-alih `replies`/`fallback`:

```
"n1": {
  "them": "はじめまして 。 {佐藤|さとう} です 。",
  "hints": ["Salam kenal. Saya Sato."],          // ditampilkan sebagai "Artinya:"
  "choices": [
    { "text": "はじめまして 。 バグス です 。", "next": "n2", "ok": true },
    { "text": "さようなら 。", "next": "n2", "ok": false,
      "feedback": "「さようなら」 = selamat tinggal. Saat pertama bertemu pakai 「はじめまして」." }
  ]
}
```

Setiap node wajib punya minimal satu pilihan `ok`, dan pilihan dengan `ok: false` wajib punya `feedback`.

### glosarium bacaan

`term` glosarium harus sama dengan salah satu token di `text` (dibandingkan tanpa furigana dan tanda kutip), misalnya token `{仕事|しごと}` dengan glosarium `"term": "{仕事|しごと}"`.

Panduan tingkat Jepang:

| Tingkat | Isi | Gaya tugas |
|---|---|---|
| Kana | hiragana, katakana, dakuten, huruf kecil | baca huruf, kata serapan, salam |
| N5 | です/ます, partikel dasar, これ/それ, angka, arah | perkenalan, memesan, bertanya arah |
| N4 | bentuk て/た/ない, izin, kewajiban, keinginan, pengalaman | kantor, rencana, hobi, opini |
| N3–N2 | keigo, bentuk pasif/kausatif, kosakata berita | rapat, artikel, email kerja |
| N1 | ungkapan formal dan tulisan | berita, esai, diskusi |

## items (kartu fondasi)

| Field | Isi |
|---|---|
| `id` | unik global, mis. `en-u01-i03` |
| `type` | `word`, `phrasal_verb`, `collocation`, `idiom`, `pattern` |
| `term` | kata/frasa bahasa target |
| `meaning` | arti dalam bahasa Indonesia |
| `example` | kalimat contoh bahasa target |
| `example_id` | terjemahan kalimat contoh |
| `cloze` | kalimat contoh dengan `____` untuk latihan isi celah |
| `answer` | jawaban untuk `cloze` |
| `note` | opsional, jebakan umum bagi penutur Indonesia |

Setiap item menjadi satu kartu FSRS. Satu item bisa ditampilkan dalam beberapa bentuk latihan (arti, isi celah, dengar).

## grammar

`id`, `title`, `explanation` (bahasa Indonesia), `examples` (array), `common_mistake` (`wrong`, `right`).

## listening

`id`, `title`, `speakers` (nama dan aksen `en-US`/`en-GB` untuk suara browser), `lines` (`speaker`, `text`), `dictation` (indeks baris yang didiktekan), `questions`.

## reading

`id`, `title`, `text`, `glossary` (kata yang bisa diklik: `term`, `meaning`, `item_id` opsional), `questions`.

## questions (dipakai listening dan reading)

`q`, `options` (array), `answer` (indeks jawaban benar), `explain` (opsional).

## writing

`id`, `prompt` (bahasa Indonesia), `min_words`, `max_words`, `checklist` (array), `useful_phrases`, `model_answer`.
Saat dikirim, teks dicek ke LanguageTool (`https://api.languagetool.org/v2/check`, `language=en-US`).

## speaking

`id`, `mode` (`shadowing` atau `answer`), `sentences` (untuk shadowing) atau `prompt` + `sample_answer` (untuk menjawab), `focus` (catatan pelafalan).
Penilaian: hasil SpeechRecognition dibandingkan kata per kata dengan target.

## conversation (dialog bercabang)

```
{
  "id": "...", "title": "...", "role_you": "...", "role_them": "...",
  "start": "n1",
  "nodes": {
    "n1": {
      "them": "kalimat lawan bicara",
      "hints": ["ide jawaban dalam bahasa Indonesia"],
      "replies": [
        { "match": ["kata kunci", "frasa"], "next": "n2", "feedback": "opsional" }
      ],
      "fallback": { "next": "n2", "feedback": "contoh jawaban yang lebih baik" }
    },
    "end": { "them": "...", "end": true }
  }
}
```

Jawaban pengguna (ketik atau suara) dicocokkan dengan `match` memakai fuzzy matching. Kalau tidak ada yang cocok, `fallback` dipakai dan contoh jawaban ditampilkan, jadi dialog tidak pernah macet.
