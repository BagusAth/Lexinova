"use client";

import { findItem } from "@/lib/content";
import { emptyDay, streak, todayKey, useProgress } from "@/lib/progress";
import { dueTomorrow } from "@/lib/srs";
import { OrbitRing } from "@/components/cosmic";
import { ButtonLink, Card, Loading, Muted, Spacer, TopBar } from "@/components/ui";

export default function Hasil() {
  const p = useProgress();
  if (!p) return <Loading />;

  const day = p.days[todayKey()] ?? emptyDay();
  const goal = p.settings.dailyGoal;
  const reached = day.xp >= goal;
  const acc = day.total ? Math.round((day.correct / day.total) * 100) : 0;
  const tomorrow = dueTomorrow(p)
    .map((id) => findItem(id)?.term)
    .filter(Boolean)
    .slice(0, 8);

  const stats = [
    { label: "akurasi", value: day.total ? `${acc}%` : "–" },
    { label: "hari streak", value: streak(p) },
    { label: "kata baru", value: day.newWords.length },
    { label: "kartu direview", value: day.reviewed.length },
  ];

  return (
    <div className="stagger flex flex-1 flex-col gap-4">
      <TopBar left="Hasil hari ini" right={new Date().toLocaleDateString("id-ID", { weekday: "long" })} />
      <OrbitRing value={day.xp / goal} size={170}>
        <div>
          <div className="font-display text-3xl font-bold">{day.xp} XP</div>
          <div className={`text-xs ${reached ? "text-cyan" : "text-mute"}`}>{reached ? "target tercapai ✦" : `target ${goal} XP`}</div>
        </div>
      </OrbitRing>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface/85 p-3 text-center">
            <b className="block font-display text-2xl text-cyan">{s.value}</b>
            <Muted>{s.label}</Muted>
          </div>
        ))}
      </div>

      <Card>
        <Muted className="mb-1 font-bold">Muncul lagi besok</Muted>
        {tomorrow.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tomorrow.map((t) => (
              <span key={t} className="rounded-full bg-elevated px-2.5 py-1 text-sm text-moon">
                {t}
              </span>
            ))}
          </div>
        ) : (
          <Muted>Belum ada kartu terjadwal besok.</Muted>
        )}
      </Card>

      <Spacer />
      <ButtonLink href="/">Kembali ke beranda</ButtonLink>
    </div>
  );
}
