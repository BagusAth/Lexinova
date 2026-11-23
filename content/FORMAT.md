# Format materi Lexinova

Semua materi disimpan sebagai file JSON di repo (`content/<bahasa>/unit-XX.json`). Aplikasi tidak memanggil AI; materi baru dibuat bersama Claude lewat chat, ditinjau, lalu ditambahkan sebagai file.

## Struktur satu unit

```
{
  "id": "en-u01",            // <bahasa>-u<nomor>
  "language": "en",          // en | ko | ja
  "level": "B1",             // tingkat jalur: B1 | B1+ | B2 | B2+ | C1 (nanti TOPIK/JLPT untuk ko/ja)
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

Kunci tujuan: `karier`, `ielts`, `studi`, `travel`. Kunci minat: `teknologi`, `bisnis`, `desain`, `sains`.
Tag yang cocok dengan profil di Pengaturan disorot di halaman Jalur.

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
