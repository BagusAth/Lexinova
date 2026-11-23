"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UNITS } from "@/lib/content";
import {
  currentLevel,
  examHref,
  frontierUnit,
  LESSON_COUNT,
  lessonsDone,
  LEVELS,
  levelIndex,
  levelReadyForExam,
  NODE_ORDER,
  type NodeKey,
  nodeDone,
  nodeHref,
  TAG_LABEL,
  unitPassed,
  unitsOfLevel,
  unitUnlocked,
} from "@/lib/levels";
import {
  firstName,
  type Progress,
  update,
  useProgress,
} from "@/lib/progress";
import { SKILL_LABEL } from "@/lib/schedule";
import type { Unit } from "@/lib/types";
import {
  Icon,
  type IconKind,
  Planet,
  Sparkle,
} from "@/components/cosmic";
import { ButtonLink, Loading, ProgressBar, SectionTitle } from "@/components/ui";

const NODE_LABEL: Record<NodeKey, string> = {
  fondasi: "Fondasi",
  grammar: "Tata bahasa",
  ...SKILL_LABEL,
  ujian: "Ujian Unit",
};

const NODE_SUB: Record<NodeKey, string> = {
  fondasi: "Kosakata & kolokasi",
  grammar: "Penjelasan & cek singkat",
  listening: "Dialog dan dikte",
  reading: "Artikel pendek",
  writing: "Teks singkat",
  speaking: "Shadowing & menjawab",
  conversation: "Dialog bercabang",
  ujian: `3 nyawa · buka unit berikutnya`,
};

// Pola zigzag jalur (px dari tengah), seperti jalur Duolingo.
const ZIG = [0, 52, 78, 52, 0, -52, -78];

const LANGS = [
  { code: "EN", name: "Bahasa Inggris", active: true, colors: ["#6C63FF", "#7DD3FC"] },
  { code: "KO", name: "Bahasa Korea", active: false, colors: ["#fb7185", "#A99BFF"] },
  { code: "JA", name: "Bahasa Jepang", active: false, colors: ["#fda4af", "#F4F3FF"] },
];

export default function Jalur() {
  const p = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  if (!p) return <Loading />;

  const cur = currentLevel(p);
  const sel = picked ?? cur;
  const name = firstName(p);
  const target = Math.max(0, levelIndex(p.settings.targetLevel));

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold">Jalur {name}</h1>
        <p className="mt-1 text-mute">
          Lulus ujian untuk membuka unit berikutnya dan naik tingkat. Makin
          tinggi tingkatnya, makin sedikit bantuan dan makin besar XP-nya.
        </p>
      </div>

      <LevelHero p={p} cur={cur} target={target} />

      {/* Tangga tingkat */}
      <section className="flex flex-col gap-3">
        <SectionTitle>Tingkat</SectionTitle>
        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0"
          role="tablist"
          aria-label="Pilih tingkat"
        >
          {LEVELS.map((l, i) => {
            const passed = !!p.path.passedLevels[l.id];
            const isCur = i === cur && !passed;
            const empty = unitsOfLevel(i).length === 0;
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={sel === i}
                onClick={() => setPicked(i)}
                style={{ "--i": i } as React.CSSProperties}
                className={`pop-in relative flex min-w-24 flex-col items-center gap-1 rounded-3xl px-3 py-3 ring-1 transition ${
                  sel === i
                    ? "bg-elevated ring-lavender/60"
                    : "bg-surface ring-transparent hover:ring-lavender/30"
                }`}
              >
                {i === target && (
                  <span className="absolute top-2 right-2 text-gold" title="Target kamu">
                    <Icon kind="target" size={14} />
                  </span>
                )}
                <span
                  className={`grid size-11 place-items-center rounded-full text-sm font-extrabold ${
                    passed
                      ? "bg-ok/20 text-ok"
                      : isCur
                        ? "bg-gradient-to-br from-primary to-lavender text-ink shadow-glow"
                        : "bg-elevated text-mute"
                  }`}
                >
                  {passed ? (
                    <Icon kind="check" size={20} strokeWidth={2.6} />
                  ) : i > cur ? (
                    <Icon kind="lock" size={18} />
                  ) : (
                    l.cefr
                  )}
                </span>
                <span className="text-sm font-bold">{l.cefr}</span>
                <span className="text-[11px] text-mute">
                  {passed ? "Lulus" : isCur ? "Sekarang" : empty ? "Menyusul" : "Terkunci"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <LevelUnits p={p} li={sel} cur={cur} />

      <section className="flex flex-col gap-3">
        <SectionTitle>Bahasa</SectionTitle>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {LANGS.map((l) => (
            <div
              key={l.code}
              className={`flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-soft ${l.active ? "" : "opacity-60"}`}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-extrabold text-ink"
                style={{ background: `linear-gradient(135deg, ${l.colors[0]}, ${l.colors[1]})` }}
              >
                {l.code}
              </span>
              <div className="flex-1">
                <div className="font-bold">{l.name}</div>
                <div className="text-sm text-mute">
                  {l.active ? `${LEVELS[cur].cefr} · ${LEVELS[cur].name}` : "Segera hadir"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function LevelHero({ p, cur, target }: { p: Progress; cur: number; target: number }) {
  const l = LEVELS[cur];
  const units = unitsOfLevel(cur);
  const passedCount = units.filter((u) => unitPassed(p, u)).length;
  const ready = levelReadyForExam(p, cur);
  const next = LEVELS[cur + 1];
  const allDone = LEVELS.every((x) => p.path.passedLevels[x.id]);
  const gap = target - cur;

  return (
    <section className="card-nebula relative overflow-hidden rounded-[2rem] p-6">
      <Sparkle className="absolute top-6 right-1/3" size={12} />
      <Sparkle className="absolute right-10 bottom-10" size={9} color="#C5B8FF" delay={1} />
      <div className="absolute -right-8 -bottom-10 animate-float opacity-90">
        <Planet id="level-hero" tone={l.tone} size={170} />
      </div>
      <div className="relative z-10 flex max-w-xl flex-col gap-2 sm:max-w-[65%]">
        <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide uppercase">
          {allDone ? "Semua tingkat lulus" : "Tingkat sekarang"}
        </span>
        <h2 className="text-3xl leading-tight font-extrabold">
          {l.cefr} · {l.name}
        </h2>
        <p className="text-sm text-ink/85">{l.canDo}</p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white/15 px-2.5 py-1">≈ IELTS {l.ielts}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1">≈ TOEFL iBT {l.toefl}</span>
        </div>
        {units.length > 0 ? (
          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-ink/85">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/20">
              <i
                className="block h-full rounded-full bg-ink"
                style={{ width: `${(passedCount / units.length) * 100}%` }}
              />
            </div>
            {passedCount}/{units.length} unit lulus
          </div>
        ) : (
          <p className="text-sm text-ink/85">Materi tingkat ini sedang disiapkan.</p>
        )}
        <p className="text-sm font-semibold">
          {gap > 0
            ? `Target: ${LEVELS[target].cefr} (IELTS ${LEVELS[target].ielts}), ${gap} tingkat lagi.`
            : `Target ${LEVELS[target].cefr} tercapai. Mau pasang target baru di Pengaturan?`}
        </p>
        {units.length > 0 && !allDone && (
          <div className="mt-2 flex flex-wrap gap-2">
            <ButtonLink
              href={examHref("level", l.id)}
              variant={ready ? "light" : "alt"}
              className="w-fit px-6 py-2.5 md:min-w-0"
            >
              <Icon kind="trophy" size={18} />
              {ready
                ? next
                  ? `Ujian naik ke ${next.cefr}`
                  : "Ujian akhir C1"
                : next
                  ? `Uji lompat ke ${next.cefr}`
                  : "Ujian akhir C1"}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

function LevelUnits({ p, li, cur }: { p: Progress; li: number; cur: number }) {
  const units = unitsOfLevel(li);
  const l = LEVELS[li];
  if (!units.length)
    return (
      <section className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center">
        <Planet id={`empty-${l.id}`} tone={l.tone} size={64} ring={false} />
        <div className="font-bold">Materi {l.cefr} sedang disiapkan</div>
        <p className="max-w-md text-sm text-mute">
          Unit untuk tingkat ini belum ditulis. Minta Claude membuat unit {l.cefr} baru sesuai
          tujuan dan minatmu, lalu tambahkan ke folder content.
        </p>
      </section>
    );

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        action={<span className="text-sm text-mute">≈ IELTS {l.ielts}</span>}
      >
        Unit {l.cefr}
      </SectionTitle>
      {li > cur && (
        <p className="rounded-2xl bg-elevated px-4 py-3 text-sm text-mute">
          Tingkat ini terbuka setelah kamu lulus Ujian Naik Tingkat {LEVELS[cur].cefr}. Sudah
          merasa mampu? Ambil Uji Lompat di kartu atas.
        </p>
      )}
      <div key={li} className="stagger grid grid-cols-1 gap-4 lg:grid-cols-2">
        {units.map((u, i) => (
          <div key={u.id} style={{ "--i": i } as React.CSSProperties}>
            <UnitCard p={p} u={u} />
          </div>
        ))}
      </div>
    </section>
  );
}

const NODE_ICON: Record<NodeKey, IconKind> = {
  fondasi: "fondasi",
  grammar: "grammar",
  listening: "listening",
  reading: "reading",
  writing: "writing",
  speaking: "speaking",
  conversation: "conversation",
  ujian: "trophy",
};

function UnitCard({ p, u }: { p: Progress; u: Unit }) {
  const router = useRouter();
  const unlocked = unitUnlocked(p, u);
  const passed = unitPassed(p, u);
  const isFrontier = frontierUnit(p).id === u.id;
  const [open, setOpen] = useState(isFrontier);
  const done = lessonsDone(p, u);
  const number = UNITS.findIndex((x) => x.id === u.id) + 1;
  const firstOpen = NODE_ORDER.find((k) => !nodeDone(p, u, k));
  const interests = new Set([...p.settings.goals, ...p.settings.interests]);

  function go(key: NodeKey) {
    update((d) => void (d.settings.unitId = u.id));
    router.push(nodeHref(key, u.id));
  }

  return (
    <article
      className={`flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-soft ring-1 ${
        isFrontier ? "ring-lavender/50" : "ring-transparent"
      } ${unlocked ? "" : "opacity-70"}`}
    >
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold tracking-wide text-lavender uppercase">
            Unit {number} · {u.level}
          </div>
          <h3 className="text-lg leading-snug font-extrabold">{u.title}</h3>
          <p className="text-sm text-mute">{u.theme}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            passed
              ? "bg-ok/15 text-ok"
              : unlocked
                ? "bg-primary/25 text-lavender"
                : "bg-elevated text-mute"
          }`}
        >
          {passed ? "Lulus" : unlocked ? `${done}/${LESSON_COUNT} pelajaran` : "Terkunci"}
        </span>
      </header>

      {u.tags && u.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {u.tags.map((t) => (
            <span
              key={t}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                interests.has(t) ? "bg-cyan/15 text-cyan" : "bg-elevated text-mute"
              }`}
            >
              {TAG_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      )}

      {!unlocked ? (
        <p className="flex items-center gap-2 rounded-2xl bg-elevated px-4 py-3 text-sm text-mute">
          <Icon kind="lock" size={16} /> Lulus Ujian Unit sebelumnya untuk membuka unit ini.
        </p>
      ) : (
        <>
          <ProgressBar value={(done + (passed ? 1 : 0)) / NODE_ORDER.length} className="h-2" />
          {open ? (
            <ol className="flex flex-col items-center gap-3 pt-7 pb-2">
              {NODE_ORDER.map((k, i) => {
                const isDone = nodeDone(p, u, k);
                const isNext = k === firstOpen;
                return (
                  <li
                    key={k}
                    className="pop-in relative flex w-full justify-center"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      onClick={() => go(k)}
                      aria-label={`${NODE_LABEL[k]}${isDone ? ", selesai" : ""}`}
                      className="group relative flex flex-col items-center"
                      style={{ transform: `translateX(${ZIG[i]}px)` }}
                    >
                      {isNext && (
                        <span className="animate-float absolute -top-7 z-10 rounded-xl bg-ink px-2.5 py-1 text-[11px] font-extrabold whitespace-nowrap text-[#2a2470] shadow-soft">
                          {k === "ujian" ? "UJIAN" : "MULAI"}
                        </span>
                      )}
                      <span
                        className={`relative grid size-16 place-items-center rounded-full border-b-4 transition group-active:translate-y-0.5 group-active:border-b-2 ${
                          isDone
                            ? "border-[#3d358f] bg-gradient-to-br from-primary to-lavender text-ink"
                            : isNext
                              ? "animate-pulse-ring border-[#3d358f] bg-gradient-to-br from-primary to-[#8b7fff] text-ink"
                              : "border-[#1a1b33] bg-elevated text-mute group-hover:text-ink"
                        }`}
                      >
                        <Icon kind={NODE_ICON[k]} size={26} strokeWidth={2} />
                        {isDone && (
                          <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-ok text-[#0b2a1a] ring-2 ring-surface">
                            <Icon kind="check" size={14} strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className="mt-1 text-xs font-bold">{NODE_LABEL[k]}</span>
                      <span className="sr-only">{NODE_SUB[k]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="rounded-full bg-elevated px-4 py-2 text-sm font-semibold transition hover:bg-[#33345a]"
            >
              {open ? "Tutup jalur" : "Lihat jalur unit"}
            </button>
            {!open && !passed && firstOpen && (
              <button
                type="button"
                onClick={() => go(firstOpen)}
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold transition hover:bg-[#7b73ff]"
              >
                Lanjut: {NODE_LABEL[firstOpen]}
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}
