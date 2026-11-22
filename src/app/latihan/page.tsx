"use client";

import Link from "next/link";
import { getUnit } from "@/lib/content";
import { todayKey, useProgress } from "@/lib/progress";
import { SKILL_LABEL, skillForDate } from "@/lib/schedule";
import { skillProgress } from "@/lib/stats";
import type { Skill } from "@/lib/types";
import { Icon, Planet, SKILL_TONE } from "@/components/cosmic";
import { Loading, SectionTitle } from "@/components/ui";

const DESC: Record<Skill, string> = {
  listening: "Dengar dialog, dikte, lalu jawab soal",
  reading: "Baca artikel pendek, ketuk kata sulit",
  writing: "Tulis teks singkat, cek tata bahasa",
  speaking: "Tirukan kalimat dan jawab dengan suara",
  conversation: "Dialog bercabang, ketik atau bicara",
};

const LANGS = [
  {
    code: "EN",
    name: "Bahasa Inggris",
    level: "B1 · menengah",
    active: true,
    colors: ["#6C63FF", "#7DD3FC"],
  },
  {
    code: "KO",
    name: "Bahasa Korea",
    level: "Segera hadir",
    active: false,
    colors: ["#fb7185", "#A99BFF"],
  },
  {
    code: "JA",
    name: "Bahasa Jepang",
    level: "Segera hadir",
    active: false,
    colors: ["#fda4af", "#F4F3FF"],
  },
];

export default function Jelajah() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  const today = skillForDate();

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold">Jelajah</h1>
        <p className="mt-1 text-mute">
          Pilih latihan yang ingin kamu kerjakan sekarang.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle
          action={<span className="text-sm text-mute">{unit.title}</span>}
        >
          Keterampilan
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(SKILL_LABEL) as Skill[]).map((s) => {
            const ids = (unit[s] as { id: string }[]).map((x) => x.id);
            const doneToday =
              ids.length > 0 &&
              ids.every((id) => p.done[id]?.date === todayKey());
            const pct = Math.round(skillProgress(p, unit, s) * 100);
            return (
              <Link
                key={s}
                href={`/${s}`}
                className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-surface p-5 shadow-soft ring-1 transition hover:-translate-y-1 hover:ring-lavender/50 active:scale-[0.98] ${
                  today === s ? "ring-lavender/50" : "ring-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="transition group-hover:rotate-12">
                    <Planet id={`ex-${s}`} tone={SKILL_TONE[s]} size={60} />
                  </div>
                  {doneToday ? (
                    <span className="rounded-full bg-ok/15 px-2.5 py-1 text-[11px] font-bold text-ok">
                      Selesai hari ini
                    </span>
                  ) : today === s ? (
                    <span className="rounded-full bg-primary/25 px-2.5 py-1 text-[11px] font-bold text-lavender">
                      Jadwal hari ini
                    </span>
                  ) : null}
                </div>
                <div>
                  <div className="text-lg font-bold">{SKILL_LABEL[s]}</div>
                  <div className="text-sm text-mute">{DESC[s]}</div>
                </div>
                <div className="text-xs font-semibold text-mute">
                  {pct}% unit ini
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Bahasa</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {LANGS.map((l) => (
            <div
              key={l.code}
              className={`flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-soft ${l.active ? "" : "opacity-60"}`}
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full text-sm font-extrabold text-ink"
                style={{
                  background: `linear-gradient(135deg, ${l.colors[0]}, ${l.colors[1]})`,
                }}
              >
                {l.code}
              </span>
              <div className="flex-1">
                <div className="font-bold">{l.name}</div>
                <div className="text-sm text-mute">{l.level}</div>
              </div>
              {l.active ? (
                <span className="grid size-8 place-items-center rounded-full bg-primary text-ink">
                  <Icon kind="check" size={16} strokeWidth={2.6} />
                </span>
              ) : (
                <span className="text-xs font-semibold text-mute">Nanti</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
