"use client";

import Link from "next/link";
import { getUnit } from "@/lib/content";
import { emptyDay, streak, todayKey, useProgress } from "@/lib/progress";
import { DAY_SHORT, formatDateId, ROTATION, SKILL_LABEL, SKILL_SHORT, skillForDate } from "@/lib/schedule";
import { buildQueue } from "@/lib/srs";
import type { Skill, Unit } from "@/lib/types";
import { Logo, OrbitRing, Planet } from "@/components/cosmic";
import { Big, ButtonLink, CardLink, Loading, Muted, Spacer } from "@/components/ui";

const SKILLS = Object.keys(SKILL_LABEL) as Skill[];

function skillDetail(unit: Unit, skill: Skill): string {
  switch (skill) {
    case "listening":
      return `Dialog: "${unit.listening[0]?.title}"`;
    case "reading":
      return `Artikel: "${unit.reading[0]?.title}"`;
    case "writing":
      return "Email singkat ke atasan";
    case "speaking":
      return "Shadowing dan menjawab";
    case "conversation":
      return `Skenario: "${unit.conversation[0]?.title}"`;
  }
}

export default function Home() {
  const p = useProgress();
  if (!p) return <Loading />;

  const unit = getUnit(p.settings.unitId);
  const now = new Date();
  const day = p.days[todayKey(now)] ?? emptyDay();
  const q = buildQueue(p, unit.items, now);
  const skill = skillForDate(now);
  const s = streak(p, now);
  const dow = now.getDay();
  const week = [1, 2, 3, 4, 5, 6, 0]; // Senin sampai Minggu
  const foundationLeft = q.due.length + q.fresh.length;
  const goal = day.xp / p.settings.dailyGoal;

  return (
    <div className="stagger flex flex-1 flex-col gap-4">
      <header className="flex items-center gap-2">
        <Logo />
        <span className="font-display text-lg font-bold tracking-wide">Lexinova</span>
        <Link
          href="/pengaturan"
          aria-label="Pengaturan"
          className="ml-auto grid size-9 place-items-center rounded-full bg-surface/70 text-mute ring-1 ring-line transition hover:text-moon active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
          </svg>
        </Link>
      </header>

      <section className="flex items-center gap-4 rounded-3xl border border-line bg-surface/80 p-4 backdrop-blur-sm">
        <OrbitRing value={goal} size={116}>
          <div>
            <div className="font-display text-2xl font-bold">{day.xp}</div>
            <div className="text-[11px] text-mute">/ {p.settings.dailyGoal} XP</div>
          </div>
        </OrbitRing>
        <div className="flex flex-col gap-1">
          <Muted className="capitalize">{formatDateId(now)}</Muted>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-bold text-cyan">{s}</span>
            <span className="font-bold">hari streak</span>
          </div>
          <Muted>
            {unit.level} · {unit.title}
          </Muted>
        </div>
      </section>

      <CardLink href="/fondasi" className="flex items-center gap-3">
        <Planet kind="fondasi" />
        <div className="min-w-0">
          <Muted>Fondasi harian</Muted>
          {foundationLeft > 0 ? (
            <>
              <Big>{q.due.length} kartu review</Big>
              <Muted>
                + {q.fresh.length} kata baru · ±{Math.max(1, Math.round(foundationLeft * 0.3))} menit
              </Muted>
            </>
          ) : (
            <>
              <Big>Orbit hari ini beres</Big>
              <Muted>Tidak ada kartu jatuh tempo.</Muted>
            </>
          )}
        </div>
      </CardLink>

      {skill ? (
        <CardLink href={`/${skill}`} className="relative flex items-center gap-3 overflow-hidden border-primary/50 bg-gradient-to-br from-primary/35 to-surface/90">
          <Planet kind={skill} size={52} />
          <div className="min-w-0">
            <Muted className="text-moon">Misi hari ini</Muted>
            <Big>{SKILL_LABEL[skill]}</Big>
            <Muted>{skillDetail(unit, skill)}</Muted>
          </div>
        </CardLink>
      ) : (
        <section className="rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/35 to-surface/90 p-4">
          <Muted className="text-moon">Hari bebas</Muted>
          <Big>Pilih planetmu sendiri</Big>
        </section>
      )}

      <section aria-label="Rotasi mingguan" className="relative">
        <div className="absolute top-[18px] right-6 left-6 h-px bg-gradient-to-r from-transparent via-lavender/40 to-transparent" />
        <div className="relative grid grid-cols-7 text-center text-[11px] font-bold">
          {week.map((d) => {
            const sk = ROTATION[d];
            const today = d === dow;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-9 place-items-center rounded-full ${
                    today ? "bg-primary text-ink shadow-glow animate-pulse-ring" : "bg-surface text-mute ring-1 ring-line"
                  }`}
                >
                  {sk ? SKILL_SHORT[sk] : "✦"}
                </span>
                <span className={today ? "text-ink" : "text-mute"}>{DAY_SHORT[d]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <Muted className="mb-2 font-bold">Semua latihan</Muted>
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {SKILLS.map((k) => (
            <Link
              key={k}
              href={`/${k}`}
              className="flex shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border border-line bg-surface/80 px-3 py-2.5 text-xs font-bold transition hover:border-lavender/60 active:scale-95"
            >
              <Planet kind={k} size={34} />
              {SKILL_LABEL[k]}
            </Link>
          ))}
          <Link
            href="/hasil"
            className="flex shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface/80 px-3 py-2.5 text-xs font-bold text-cyan transition hover:border-cyan/60 active:scale-95"
          >
            <span className="grid size-[34px] place-items-center text-xl">✦</span>
            Hasil
          </Link>
        </div>
      </section>

      <Spacer />
      <ButtonLink href={foundationLeft > 0 ? "/fondasi" : skill ? `/${skill}` : "/hasil"}>
        {foundationLeft > 0 ? "Mulai fondasi" : skill ? `Lanjut ke ${SKILL_LABEL[skill]}` : "Lihat hasil hari ini"}
      </ButtonLink>
    </div>
  );
}
