"use client";

import { findItem } from "@/lib/content";
import { emptyDay, streak, todayKey, useProgress } from "@/lib/progress";
import { dueTomorrow } from "@/lib/srs";
import { OrbitRing } from "@/components/cosmic";
import { Card, Loading, Muted } from "@/components/ui";

export default function Hasil() {
  const p = useProgress();
  if (!p) return <Loading />;

  const day = p.days[todayKey()] ?? emptyDay();
  const goal = p.settings.dailyGoal;
  const reached = day.xp >= goal;
  const acc = day.total ? Math.round((day.correct / day.total) * 100) : null;
  const tomorrow = dueTomorrow(p)
    .map((id) => findItem(id)?.term)
    .filter(Boolean)
    .slice(0, 10);

  const stats = [
    { label: "Akurasi", value: acc === null ? "–" : `${acc}%` },
    { label: "Streak", value: `${streak(p)} hari` },
    { label: "Kata baru", value: day.newWords.length },
    { label: "Kartu direview", value: day.reviewed.length },
  ];

  return (
    <>
      <div>
        <div className="label">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 className="mt-1 font-display text-3xl">Hasil hari ini</h1>
      </div>

      <section className="flex flex-col items-center gap-6 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <OrbitRing value={day.xp / goal} size={150}>
          <div>
            <div className="font-mono text-3xl tabular-nums">{day.xp}</div>
            <div className="label">xp</div>
          </div>
        </OrbitRing>
        <div className="w-full flex-1">
          <p className={`mb-4 text-sm ${reached ? "text-cyan" : "text-mute"}`}>{reached ? "Target harian tercapai." : `Kurang ${goal - day.xp} XP lagi untuk target ${goal} XP.`}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {stats.map((s) => (
              <div key={s.label} className="border-t border-line pt-2">
                <dt className="label">{s.label}</dt>
                <dd className="font-mono text-xl text-cyan tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Card>
        <h2 className="label mb-2">Muncul lagi besok</h2>
        {tomorrow.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {tomorrow.map((t) => (
              <li key={t} className="rounded-md border border-line px-2 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <Muted>Belum ada kartu terjadwal besok.</Muted>
        )}
      </Card>
    </>
  );
}
