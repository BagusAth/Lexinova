"use client";

import { useState } from "react";
import { getUnit } from "@/lib/content";
import { emptyDay, streak, todayKey, useProgress } from "@/lib/progress";
import { DAY_SHORT, SKILL_LABEL } from "@/lib/schedule";
import {
  changeVsPrevious,
  foundationProgress,
  longestStreak,
  skillProgress,
  vocabCount,
  xpSeries,
} from "@/lib/stats";
import type { Skill } from "@/lib/types";
import {
  Icon,
  OrbitRing,
  Planet,
  SKILL_TONE,
  Sparkle,
} from "@/components/cosmic";
import { LineChart } from "@/components/LineChart";
import { Card, Loading, ProgressBar, SectionTitle } from "@/components/ui";

const RANGES = [
  { days: 7, label: "7H" },
  { days: 30, label: "30H" },
] as const;

export default function Progres() {
  const p = useProgress();
  const [range, setRange] = useState<7 | 30>(7);
  if (!p) return <Loading />;

  const now = new Date();
  const unit = getUnit(p.settings.unitId);
  const day = p.days[todayKey(now)] ?? emptyDay();
  const series = xpSeries(p, range, now);
  const total = series.reduce((a, b) => a + b.xp, 0);
  const change = changeVsPrevious(p, range, now);
  const labels = series.map((s, i) =>
    range === 7
      ? DAY_SHORT[s.date.getDay()]
      : i % 5 === 0 || i === series.length - 1
        ? String(s.date.getDate())
        : "",
  );
  const acc = day.total ? Math.round((day.correct / day.total) * 100) : null;
  const cur = streak(p, now);

  const skills: { key: Skill | "fondasi"; label: string; value: number }[] = [
    {
      key: "fondasi",
      label: "Fondasi",
      value: foundationProgress(p, unit.items),
    },
    ...(Object.keys(SKILL_LABEL) as Skill[]).map((s) => ({
      key: s,
      label: SKILL_LABEL[s],
      value: skillProgress(p, unit, s),
    })),
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Progres</h1>
        <div
          className="flex rounded-full bg-surface p-1"
          role="tablist"
          aria-label="Rentang waktu"
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              role="tab"
              aria-selected={range === r.days}
              onClick={() => setRange(r.days)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${range === r.days ? "bg-primary text-ink shadow-glow" : "text-mute hover:text-ink"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Grafik */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm text-mute">XP {range} hari terakhir</div>
              <div className="text-3xl font-extrabold tabular-nums">
                {total}
              </div>
            </div>
            {change !== null && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${change >= 0 ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}
              >
                {change >= 0 ? "+" : ""}
                {change}% dari periode lalu
              </span>
            )}
          </div>
          <div className="mt-6">
            <LineChart data={series.map((s) => s.xp)} labels={labels} />
          </div>
        </Card>

        {/* Streak */}
        <div className="card-nebula relative flex flex-col gap-2 overflow-hidden rounded-3xl p-6">
          <Sparkle className="absolute top-5 left-1/2" size={10} />
          <div className="absolute -right-6 -bottom-6 animate-float">
            <Planet id="streak-planet" tone="amber" size={130} />
          </div>
          <div className="text-sm font-semibold text-ink/80">
            Streak belajar
          </div>
          <div className="text-5xl font-extrabold tabular-nums">{cur}</div>
          <div className="text-sm text-ink/80">hari berturut-turut</div>
          <div className="mt-auto pt-6 text-sm text-ink/80">
            Terpanjang:{" "}
            <span className="font-bold text-ink">{longestStreak(p)} hari</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hari ini */}
        <Card className="flex items-center gap-5">
          <OrbitRing value={day.xp / p.settings.dailyGoal} size={104}>
            <div>
              <div className="text-xl font-extrabold tabular-nums">
                {day.xp}
              </div>
              <div className="text-[11px] text-mute">
                / {p.settings.dailyGoal} XP
              </div>
            </div>
          </OrbitRing>
          <dl className="grid flex-1 gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-mute">Akurasi</dt>
              <dd className="font-bold text-cyan">
                {acc === null ? "–" : `${acc}%`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Kata baru</dt>
              <dd className="font-bold">{day.newWords.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Direview</dt>
              <dd className="font-bold">{day.reviewed.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Total kosakata</dt>
              <dd className="font-bold">{vocabCount(p)}</dd>
            </div>
          </dl>
        </Card>

        {/* Per keterampilan */}
        <Card className="flex flex-col gap-4 lg:col-span-2">
          <SectionTitle
            action={<span className="text-sm text-mute">{unit.title}</span>}
          >
            Progres unit
          </SectionTitle>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {skills.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <Planet
                  id={`prog-${s.key}`}
                  tone={SKILL_TONE[s.key]}
                  size={36}
                  ring={false}
                />
                <div className="flex-1">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-mute tabular-nums">
                      {Math.round(s.value * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={s.value} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-sm text-mute">
        <Icon kind="star" size={16} className="text-gold" /> Capai target harian
        dan jaga streak untuk membuka pencapaian.
      </p>
    </>
  );
}
