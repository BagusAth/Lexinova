"use client";

import Link from "next/link";
import { useState } from "react";
import { getUnit, UNITS } from "@/lib/content";
import { currentLevel, LEVELS } from "@/lib/levels";
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
import type { Progress } from "@/lib/progress";

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

      <LevelCard p={p} />

      <p className="flex items-center gap-2 text-sm text-mute">
        <Icon kind="star" size={16} className="text-gold" /> Capai target harian
        dan jaga streak untuk membuka pencapaian.
      </p>
    </>
  );
}

function examName(key: string): string {
  const [kind, id] = key.split(":");
  if (kind === "unit") {
    const i = UNITS.findIndex((u) => u.id === id);
    return i < 0 ? id : `Ujian Unit ${i + 1} · ${UNITS[i].title}`;
  }
  const li = LEVELS.findIndex((l) => l.id === id);
  const next = LEVELS[li + 1];
  return next ? `Ujian naik ke ${next.cefr}` : `Ujian akhir ${LEVELS[li]?.cefr ?? id}`;
}

function LevelCard({ p }: { p: Progress }) {
  const cur = currentLevel(p);
  const history = Object.entries(p.path.exams)
    .sort((a, b) => b[1].last.localeCompare(a[1].last))
    .slice(0, 5);
  const unitsPassed = Object.keys(p.path.passedUnits).length;

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitle
        action={
          <Link href="/latihan" className="text-sm font-semibold text-lavender hover:underline">
            Lihat jalur
          </Link>
        }
      >
        Tingkat & ujian
      </SectionTitle>
      <ol className="flex items-center gap-1" aria-label="Tangga tingkat">
        {LEVELS.map((l, i) => {
          const passed = !!p.path.passedLevels[l.id];
          return (
            <li key={l.id} className="flex flex-1 items-center gap-1">
              <span
                className={`grid h-9 flex-1 place-items-center rounded-full text-xs font-extrabold ${
                  passed
                    ? "bg-ok/20 text-ok"
                    : i === cur
                      ? "bg-gradient-to-r from-primary to-lavender text-ink shadow-glow"
                      : "bg-elevated text-mute"
                }`}
              >
                {l.cefr}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-1">
          <dt className="text-mute">Tingkat sekarang</dt>
          <dd className="font-bold">
            {LEVELS[cur].cefr} · {LEVELS[cur].name}
          </dd>
          <dt className="text-mute">Perkiraan IELTS</dt>
          <dd className="font-bold text-cyan">{LEVELS[cur].ielts}</dd>
          <dt className="text-mute">Unit lulus</dt>
          <dd className="font-bold">
            {unitsPassed} dari {UNITS.length}
          </dd>
        </dl>
        <div>
          <div className="mb-2 text-sm font-semibold text-mute">Riwayat ujian</div>
          {history.length ? (
            <ul className="flex flex-col gap-2">
              {history.map(([key, r]) => (
                <li key={key} className="flex items-center gap-3 rounded-2xl bg-elevated/60 px-3 py-2 text-sm">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${r.passed ? "bg-ok/20 text-ok" : "bg-bad/15 text-bad"}`}
                  >
                    <Icon kind={r.passed ? "check" : "x"} size={14} strokeWidth={2.6} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{examName(key)}</span>
                  <span className="shrink-0 text-mute tabular-nums">
                    {Math.round(r.best * 100)}% · {r.attempts}x
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">
              Belum ada ujian. Selesaikan pelajaran unit, lalu ambil Ujian Unit di Jalur.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
