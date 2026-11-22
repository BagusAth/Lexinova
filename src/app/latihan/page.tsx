"use client";

import { getUnit } from "@/lib/content";
import { todayKey, useProgress } from "@/lib/progress";
import { SKILL_LABEL, skillForDate } from "@/lib/schedule";
import type { Skill } from "@/lib/types";
import { Icon } from "@/components/cosmic";
import { CardLink, Loading } from "@/components/ui";

const DESC: Record<Skill, string> = {
  listening: "Dengar dialog, dikte, lalu jawab soal",
  reading: "Baca artikel pendek, ketuk kata yang sulit",
  writing: "Tulis teks singkat, cek tata bahasa",
  speaking: "Tirukan kalimat dan jawab dengan suara",
  conversation: "Dialog bercabang, ketik atau bicara",
};

export default function Latihan() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  const today = skillForDate();

  return (
    <>
      <div>
        <div className="label">
          {unit.level} · {unit.title}
        </div>
        <h1 className="mt-1 font-display text-3xl">Latihan</h1>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(SKILL_LABEL) as Skill[]).map((s) => {
          const ids = (unit[s] as { id: string }[]).map((x) => x.id);
          const done = ids.length > 0 && ids.every((id) => p.done[id]?.date === todayKey());
          return (
            <CardLink key={s} href={`/${s}`} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-lavender">
                  <Icon kind={s} size={24} />
                </span>
                {done ? <span className="label text-ok">Selesai</span> : today === s ? <span className="label text-cyan">Jadwal hari ini</span> : null}
              </div>
              <div>
                <div className="font-medium">{SKILL_LABEL[s]}</div>
                <div className="text-sm text-mute">{DESC[s]}</div>
              </div>
            </CardLink>
          );
        })}
      </div>
    </>
  );
}
