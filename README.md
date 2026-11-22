# Lexinova

Aplikasi belajar bahasa Inggris pribadi (level B1), tema astronomi, 100% gratis.
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

## Struktur

```
content/                materi pelajaran (lihat content/FORMAT.md)
  en/unit-01.json
public/sw.js            service worker (cache untuk offline)
public/icons/           ikon PWA (dibuat ulang: node scripts/make-icons.mjs)
src/app/                layar-layar aplikasi
  page.tsx              1. Beranda: streak, target XP, fondasi, misi hari ini
  fondasi/              2. Review kartu FSRS (kata, kolokasi, phrasal verb)
  listening/            3. Dialog + dikte + soal pemahaman
  reading/              4. Artikel dengan glosarium yang bisa diklik
  writing/              5. Menulis + cek LanguageTool + daftar cek
  speaking/             6. Shadowing dan menjawab dengan mikrofon
  conversation/         7. Dialog bercabang (ketik atau suara)
  hasil/                8. Hasil hari ini
  pengaturan/           target harian, ekspor/impor progres
src/lib/
  content.ts            daftar unit (tambahkan unit baru di sini)
  progress.ts           penyimpanan progres, streak, ekspor/impor
  srs.ts                penjadwalan kartu (ts-fsrs)
  speech.ts             suara browser (SpeechSynthesis, SpeechRecognition)
  languagetool.ts       cek tata bahasa gratis
  text.ts               perbandingan kata per kata dan fuzzy match
  schedule.ts           rotasi keterampilan per hari
src/components/         komponen UI (tema astronomi ada di cosmic.tsx dan globals.css)
```

## Menambah materi

1. Buat `content/en/unit-02.json` mengikuti `content/FORMAT.md`.
2. Import di `src/lib/content.ts` dan tambahkan ke array `UNITS`.

## Catatan

- Pengenalan suara paling andal di Chrome dan Edge.
- Progres hanya ada di browser yang dipakai. Ekspor berkala dari halaman Pengaturan.
- Saat mengubah `public/sw.js`, naikkan `VERSION` supaya cache lama dibuang.
