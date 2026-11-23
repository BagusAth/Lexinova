"use client";

import { useState } from "react";
import { UNITS } from "@/lib/content";
import { LEVELS } from "@/lib/levels";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { wordStatus, type WordStatus } from "@/lib/stats";
import { Icon } from "@/components/cosmic";
import { ButtonLink, inputClass, Loading } from "@/components/ui";

const FILTERS: { key: WordStatus | "semua"; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "baru", label: "Baru" },
  { key: "belajar", label: "Dipelajari" },
  { key: "dikuasai", label: "Dikuasai" },
];

const STATUS_STYLE: Record<WordStatus, string> = {
  baru: "bg-elevated text-mute",
  belajar: "bg-primary/20 text-lavender",
  dikuasai: "bg-ok/15 text-ok",
};

const STATUS_LABEL: Record<WordStatus, string> = {
  baru: "Baru",
  belajar: "Dipelajari",
  dikuasai: "Dikuasai",
};

export default function Kata() {
  const p = useProgress();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<WordStatus | "semua">("semua");
  const [level, setLevel] = useState<string>("semua");
  if (!p) return <Loading />;

  const items = UNITS.filter((u) => level === "semua" || u.level === level).flatMap((u) =>
    u.items.map((i) => ({ ...i, level: u.level, status: wordStatus(p, i.id) })),
  );
  const counts = {
    semua: items.length,
    baru: 0,
    belajar: 0,
    dikuasai: 0,
  } as Record<WordStatus | "semua", number>;
  items.forEach((i) => counts[i.status]++);
  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (i) =>
      (filter === "semua" || i.status === filter) &&
      (!needle ||
        i.term.toLowerCase().includes(needle) ||
        i.meaning.toLowerCase().includes(needle)),
  );

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Kata</h1>
          <p className="mt-1 text-mute">
            {counts.belajar + counts.dikuasai} dari {counts.semua} kata sudah
            mulai kamu pelajari.
          </p>
        </div>
        <div className="hidden md:block">
          <ButtonLink href="/fondasi">Review sekarang</ButtonLink>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kata atau arti…"
          className={`${inputClass} rounded-full md:max-w-xs`}
        />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${filter === f.key ? "bg-primary text-ink" : "bg-surface text-mute hover:text-ink"}`}
            >
              {f.label} <span className="opacity-60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="-mx-5 -mt-2 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0"
        aria-label="Filter tingkat"
      >
        {["semua", ...LEVELS.map((l) => l.cefr)].map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={level === l}
            onClick={() => setLevel(l)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${level === l ? "bg-cyan/20 text-cyan ring-1 ring-cyan/40" : "bg-surface text-mute hover:text-ink"}`}
          >
            {l === "semua" ? "Semua tingkat" : l}
          </button>
        ))}
      </div>

      <ul
        key={`${level}-${filter}`}
        className="stagger grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        {shown.map((i, n) => (
          <li
            key={i.id}
            style={{ "--i": Math.min(n, 10) } as React.CSSProperties}
            className="flex min-w-0 items-center gap-3 rounded-3xl bg-surface p-4 shadow-soft"
          >
            <button
              type="button"
              onClick={() => speak(i.term)}
              aria-label={`Dengar ${i.term}`}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/20 text-lavender transition hover:bg-primary/30 active:scale-90"
            >
              <Icon kind="volume" size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold">{i.term}</span>
                <span className="shrink-0 rounded-md bg-elevated px-1.5 text-[10px] font-bold text-mute">
                  {i.level}
                </span>
              </div>
              <div className="truncate text-sm text-mute">{i.meaning}</div>
              <div className="truncate text-xs text-mute/80 italic">{i.example}</div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[i.status]}`}
            >
              {STATUS_LABEL[i.status]}
            </span>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="py-10 text-center text-mute md:col-span-2">
            Tidak ada kata yang cocok.
          </li>
        )}
      </ul>
    </>
  );
}
