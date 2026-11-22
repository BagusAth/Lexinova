"use client";

import { getUnit } from "@/lib/content";
import { emptyDay, type Progress, streak, todayKey, useProgress } from "@/lib/progress";
import { DAY_SHORT, ROTATION, SKILL_LABEL, skillForDate } from "@/lib/schedule";
import { buildQueue } from "@/lib/srs";
import type { Skill, Unit } from "@/lib/types";
import { Icon, Logo, OrbitRing } from "@/components/cosmic";
import { ButtonLink, CardLink, Loading, Spacer } from "@/components/ui";

function skillDetail(unit: Unit, skill: Skill): string {
  switch (skill) {
    case "listening":
      return `Dialog "${unit.listening[0]?.title}"`;
    case "reading":
      return `Artikel "${unit.reading[0]?.title}"`;
    case "writing":
      return "Email singkat ke atasan";
    case "speaking":
      return "Shadowing dan menjawab";
    case "conversation":
      return `Skenario "${unit.conversation[0]?.title}"`;
  }
}

function skillDoneToday(p: Progress, unit: Unit, skill: Skill): boolean {
  const ids = (unit[skill] as { id: string }[]).map((x) => x.id);
  return ids.length > 0 && ids.every((id) => p.done[id]?.date === todayKey());
}

function Row({ href, icon, title, sub, status }: { href: string; icon: Parameters<typeof Icon>[0]["kind"]; title: string; sub: string; status?: string }) {
  return (
    <CardLink href={href} className="flex items-center gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line text-lavender">
        <Icon kind={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block truncate text-sm text-mute">{sub}</span>
      </span>
      {status ? (
        <span className="label text-ok">{status}</span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </CardLink>
  );
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
  const foundationLeft = q.due.length + q.fresh.length;
  const skillDone = skill ? skillDoneToday(p, unit, skill) : false;

  // Senin sampai Minggu pada minggu berjalan.
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const next = foundationLeft > 0 ? { href: "/fondasi", label: "Mulai fondasi" } : skill && !skillDone ? { href: `/${skill}`, label: `Mulai ${SKILL_LABEL[skill]}` } : { href: "/hasil", label: "Lihat hasil hari ini" };

  return (
    <>
      <header className="flex items-center gap-2 lg:hidden">
        <Logo />
        <span className="font-display text-xl">Lexinova</span>
      </header>

      <div>
        <div className="label">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 className="mt-1 font-display text-3xl">{day.xp >= p.settings.dailyGoal ? "Target hari ini tercapai." : "Selamat belajar."}</h1>
      </div>

      <section className="flex items-center gap-5 rounded-xl border border-line bg-surface p-4 sm:gap-8 sm:p-6">
        <OrbitRing value={day.xp / p.settings.dailyGoal} size={112}>
          <div>
            <div className="font-mono text-2xl tabular-nums">{day.xp}</div>
            <div className="label">/ {p.settings.dailyGoal} xp</div>
          </div>
        </OrbitRing>
        <dl className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="label">Streak</dt>
            <dd className="font-mono text-xl text-cyan tabular-nums">{s} hari</dd>
          </div>
          <div>
            <dt className="label">Unit</dt>
            <dd className="text-sm">
              {unit.level} · {unit.title}
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="label">Hari ini</h2>
        <Row
          href="/fondasi"
          icon="fondasi"
          title="Fondasi"
          sub={foundationLeft > 0 ? `${q.due.length} review · ${q.fresh.length} kata baru` : "Tidak ada kartu jatuh tempo"}
          status={foundationLeft === 0 ? "Selesai" : undefined}
        />
        {skill ? (
          <Row href={`/${skill}`} icon={skill} title={SKILL_LABEL[skill]} sub={skillDetail(unit, skill)} status={skillDone ? "Selesai" : undefined} />
        ) : (
          <Row href="/latihan" icon="latihan" title="Hari bebas" sub="Pilih latihan apa saja" />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="label">Minggu ini</h2>
        <ol className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const sk = ROTATION[d.getDay()];
            const isToday = todayKey(d) === todayKey(now);
            const studied = (p.days[todayKey(d)]?.xp ?? 0) > 0;
            return (
              <li
                key={d.toISOString()}
                className={`flex flex-col items-center gap-1.5 rounded-lg border py-2 ${isToday ? "border-lavender/60 bg-elevated" : "border-line"}`}
                title={sk ? SKILL_LABEL[sk] : "Hari bebas"}
              >
                <span className={`text-[11px] ${isToday ? "text-ink" : "text-mute"}`}>{DAY_SHORT[d.getDay()]}</span>
                <span className={isToday ? "text-lavender" : "text-mute"}>
                  <Icon kind={sk ?? "latihan"} size={16} />
                </span>
                <span className={`size-1.5 rounded-full ${studied ? "bg-cyan" : "bg-line"}`} aria-label={studied ? "sudah belajar" : "belum belajar"} />
              </li>
            );
          })}
        </ol>
      </section>

      <Spacer />
      <ButtonLink href={next.href}>{next.label}</ButtonLink>
    </>
  );
}
