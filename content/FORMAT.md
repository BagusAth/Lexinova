# Format materi Lexinova

Semua materi disimpan sebagai file JSON di repo (`content/<bahasa>/unit-XX.json`). Aplikasi tidak memanggil AI; materi baru dibuat bersama Claude lewat chat, ditinjau, lalu ditambahkan sebagai file.

## Struktur satu unit

```
{
  "id": "en-u01",            // <bahasa>-u<nomor>
  "language": "en",          // en | ko | ja
  "level": "B1",             // CEFR untuk en; nanti TOPIK/JLPT untuk ko/ja
  "title": "...",            // judul unit (bahasa Indonesia)
  "theme": "...",
  "items": [...],            // kartu fondasi (masuk review FSRS)
  "grammar": [...],          // poin tata bahasa singkat
  "listening": [...],
  "reading": [...],
  "writing": [...],
  "speaking": [...],
  "conversation": [...]
}
```

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
