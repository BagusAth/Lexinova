# Lexinova

Aplikasi belajar bahasa pribadi untuk Bagus Athallah, bertema astronomi dan 100% gratis:

- **Bahasa Inggris**: B1 → B1+ → B2 → B2+ → C1 (10 unit, 120 kartu).
- **Bahasa Jepang**: Kana → N5 → N4 → N3 → N2 → N1 (6 unit untuk Kana, N5, N4; 139 kartu. N3–N1 menyusul).

Next.js + TypeScript + Tailwind, dipasang sebagai PWA, di-host gratis di Vercel.
Tidak ada server, database, atau AI berbayar: materi ada di file JSON, progres di `localStorage`.

## Menjalankan

```powershell
npm install
npm run dev
```

Buka http://localhost:3000. Service worker (mode offline) hanya aktif di build produksi:

```powershell
npm run build
npm start
```

Sebelum commit materi baru, jalankan validasi:

```powershell
npm run check:content
```

## Cara belajar

- **Kursus**: pilih Inggris atau Jepang di tab Jalur. Progres, unit terakhir, dan target disimpan terpisah per kursus.
- **Jalur**: setiap tingkat berisi 2 unit. Inggris 5 tingkat (B1–C1), Jepang 6 tingkat (Kana–N1).
- Tiap unit punya 7 pelajaran: Fondasi (kartu FSRS), Tata bahasa, Listening, Reading, Writing, Speaking, Conversation. Unit ditutup dengan **Ujian Unit** (3 nyawa).
- Setelah semua unit di satu tingkat lulus, **Ujian Naik Tingkat** membuka tingkat berikutnya. Ujian ini juga bisa diambil lebih awal sebagai Uji Lompat.
- Makin tinggi tingkatnya, makin sedikit bantuan (isi celah diketik, kata pengecoh, audio tanpa opsi pelan, transkrip dan ide jawaban disembunyikan) dan makin besar XP-nya.
- Beranda menampilkan misi harian: review kartu dulu, lalu pelajaran yang terjadwal hari ini, atau ujian bila pelajaran unit sudah tuntas.
- **Bahasa Jepang ala Duolingo**: tanpa keyboard Jepang (pilihan ganda, susun ubin kata, dialog dengan pilihan balasan). Kanji diberi furigana, romaji dibuat otomatis dan bisa dimatikan di Pengaturan. Mulai N4 romaji disembunyikan, mulai N3 furigana baru muncul saat kanji diketuk.

## Struktur

```
content/                materi pelajaran (lihat content/FORMAT.md)
  en/unit-01..10.json   bahasa Inggris, 2 unit per tingkat
  ja/unit-01..06.json   bahasa Jepang: hiragana, katakana, 2×N5, 2×N4
scripts/
  check-content.mjs     validasi materi (npm run check:content)
public/sw.js            service worker (cache untuk offline)
src/app/                layar-layar aplikasi
  page.tsx              Beranda: sapaan, misi harian, streak, lanjutkan belajar
  latihan/              Jalur: tingkat, unit, node pelajaran, uji lompat
  fondasi/              review kartu FSRS (kata, kolokasi, phrasal verb)
  tata-bahasa/          penjelasan tata bahasa + cek singkat
  listening/            dialog + dikte + soal pemahaman
  reading/              artikel dengan glosarium yang bisa diklik
  writing/              menulis + cek LanguageTool + daftar cek
  speaking/             shadowing dan menjawab dengan mikrofon
  conversation/         dialog bercabang (ketik atau suara)
  ujian/                Ujian Unit dan Ujian Naik Tingkat (?unit=… / ?tingkat=…)
  hasil/                Progres: grafik XP, streak, tingkat, riwayat ujian
  kata/                 daftar kosakata dengan filter status dan tingkat
  pengaturan/           profil belajar, target, penyimpanan, ekspor/impor
src/lib/
  content.ts            daftar unit (tambahkan unit baru di sini)
  levels.ts             kursus, tingkat, profil kesulitan, aturan buka-kunci jalur
  course.ts             ganti kursus (Inggris/Jepang)
  ja.ts                 markup Jepang {漢字|かな}, furigana, romaji otomatis
  exam.ts               generator dan penilaian soal ujian
  progress.ts           penyimpanan progres, streak, ekspor/impor
  srs.ts                penjadwalan kartu (ts-fsrs)
  speech.ts             suara browser (SpeechSynthesis, SpeechRecognition)
  languagetool.ts       cek tata bahasa gratis
  text.ts               perbandingan kata per kata dan fuzzy match
  schedule.ts           rotasi keterampilan per hari
src/components/         komponen UI (tema astronomi ada di cosmic.tsx dan globals.css)
  T.tsx                 tampilan teks materi (furigana/romaji untuk Jepang)
  Tiles.tsx             ubin susun kalimat dan tombol audio
  motion.tsx            konfeti, angka menghitung naik, toast combo
```

## Menambah materi

1. Buat `content/en/unit-11.json` atau `content/ja/unit-07.json` mengikuti `content/FORMAT.md` (isi kolom `language`, `level`, dan `tags`; teks Jepang memakai markup `{漢字|かな}`).
2. Import di `src/lib/content.ts` dan tambahkan ke array `UNITS`, berurutan sesuai tingkat.
3. Jalankan `npm run check:content` sampai hasilnya "Materi valid".

## Catatan

- Pengenalan suara paling andal di Chrome dan Edge. Untuk suara Jepang, browser perlu punya suara `ja-JP` (Edge dan Chrome di Windows biasanya sudah ada).
- Progres tersimpan otomatis per browser dan per alamat situs (localhost dan alamat Vercel terpisah). Ekspor berkala dari Pengaturan, lalu impor saat pindah browser atau perangkat.
- Saat mengubah `public/sw.js`, naikkan `VERSION` supaya cache lama dibuang.
