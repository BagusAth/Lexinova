"use client";

import Link from "next/link";
import { getUnit } from "@/lib/content";
import {
  currentLevel,
  examHref,
  LESSON_COUNT,
  lessonsDone,
  LEVELS,
  levelReadyForExam,
  unitPassed,
} from "@/lib/levels";
import {
  emptyDay,
  OWNER,
  streak,
  todayKey,
  useProgress,
} from "@/lib/progress";
import { SKILL_LABEL, skillForDate } from "@/lib/schedule";
import { buildQueue } from "@/lib/srs";
import {
  foundationProgress,
  greeting,
  skillProgress,
  vocabCount,
} from "@/lib/stats";
import type { Skill } from "@/lib/types";
import {
  Astronaut,
  Icon,
  MoonScene,
  Planet,
  SKILL_TONE,
  Sparkle,
} from "@/components/cosmic";
import {
  ButtonLink,
  Loading,
  ProgressBar,
  SectionTitle,
} from "@/components/ui";

const SKILLS = Object.keys(SKILL_LABEL) as Skill[];

const SKILL_SUB: Record<Skill, string> = {
  listening: "Dialog dan dikte",
  reading: "Artikel pendek",
  writing: "Email dan teks singkat",
  speaking: "Shadowing dan menjawab",
  conversation: "Dialog bercabang",
};

export default function Home() {
  const p = useProgress();
  if (!p) return <Loading />;

  const unit = getUnit(p.settings.unitId);
  const now = new Date();
  const day = p.days[todayKey(now)] ?? emptyDay();
  const q = buildQueue(p, unit.items, now);
  const skill = skillForDate(now);
  const foundationLeft = q.due.length + q.fresh.length;
  const goal = p.settings.dailyGoal;
  const li = currentLevel(p);
  const level = LEVELS[li];
  const next = LEVELS[li + 1];
  const unitReady =
    lessonsDone(p, unit) === LESSON_COUNT && !unitPassed(p, unit);

  const mission =
    foundationLeft > 0
      ? {
          title: "Fondasi harian",
          sub: `${q.due.length} review dan ${q.fresh.length} kata baru menunggumu`,
          href: "/fondasi",
          cta: "Mulai",
        }
      : unitReady
        ? {
            title: "Saatnya Ujian Unit",
            sub: `Semua pelajaran ${unit.title} sudah selesai. Lulus untuk membuka unit berikutnya.`,
            href: examHref("unit", unit.id),
            cta: "Mulai ujian",
          }
        : levelReadyForExam(p, li) && next
          ? {
              title: `Ujian naik ke ${next.cefr}`,
              sub: `Semua unit ${level.cefr} lulus. Satu ujian lagi untuk naik tingkat.`,
              href: examHref("level", level.id),
              cta: "Mulai ujian",
            }
          : skill
        ? {
            title: `Misi ${SKILL_LABEL[skill]}`,
            sub: SKILL_SUB[skill],
            href: `/${skill}`,
            cta: "Mulai",
          }
        : {
            title: "Hari bebas",
            sub: "Jelajahi latihan mana pun yang kamu mau",
            href: "/latihan",
            cta: "Jelajah",
          };

  const rows: {
    key: Skill | "fondasi";
    title: string;
    sub: string;
    href: string;
    value: number;
  }[] = [
    {
      key: "fondasi",
      title: "Fondasi",
      sub: "Kosakata dan kolokasi",
      href: "/fondasi",
      value: foundationProgress(p, unit.items),
    },
    ...SKILLS.map((s) => ({
      key: s,
      title: SKILL_LABEL[s],
      sub: SKILL_SUB[s],
      href: `/${s}`,
      value: skillProgress(p, unit, s),
    })),
  ];

  return (
    <>
      {/* Sapaan */}
      <header className="flex items-center gap-3">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#3d358f] to-primary ring-2 ring-lavender/40">
          <div className="translate-y-2">
            <Astronaut size={58} id="avatar" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-sm text-mute">{greeting(now)},</div>
          <div className="truncate text-xl font-extrabold">
            {p.settings.name.trim() || OWNER}
          </div>
        </div>
        <Link
          href="/latihan"
          className="ml-auto shrink-0 rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-lavender ring-1 ring-lavender/30 transition hover:ring-lavender/60 lg:ml-auto"
          title={`${level.name} · perkiraan IELTS ${level.ielts}`}
        >
          {level.cefr}
          <span className="ml-1 hidden font-semibold text-mute sm:inline">
            · {level.name}
          </span>
        </Link>
        <Link
          href="/pengaturan"
          aria-label="Pengaturan"
          className="grid size-11 place-items-center rounded-full bg-surface text-mute transition hover:text-ink active:scale-90 lg:hidden"
        >
          <Icon kind="settings" size={20} />
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Misi harian */}
        <section className="card-nebula relative flex min-h-48 overflow-hidden rounded-[2rem] p-6 lg:col-span-2">
          <Sparkle className="absolute top-5 right-1/3" size={12} />
          <Sparkle
            className="absolute right-8 bottom-8"
            size={9}
            color="#C5B8FF"
            delay={1}
          />
          <div className="relative z-10 flex max-w-[60%] flex-col gap-2">
            <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide uppercase">
              Misi harian
            </span>
            <h2 className="text-2xl leading-tight font-extrabold">
              {mission.title}
            </h2>
            <p className="text-sm text-ink/80">{mission.sub}</p>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-ink/80">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-white/20">
                <i
                  className="block h-full rounded-full bg-ink"
                  style={{ width: `${Math.min(100, (day.xp / goal) * 100)}%` }}
                />
              </div>
              {day.xp}/{goal} XP
            </div>
            <ButtonLink
              href={mission.href}
              variant="light"
              className="mt-3 w-fit px-8 py-2.5 md:min-w-0"
            >
              {mission.cta}
            </ButtonLink>
          </div>
          <div className="absolute -right-2 -bottom-6 sm:right-4">
            <MoonScene size={170} />
          </div>
        </section>

        {/* Statistik */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Link
            href="/kata"
            className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 lg:flex-row lg:items-center"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-cyan/15 text-cyan">
              <Icon kind="book" size={22} />
            </span>
            <div>
              <div className="text-2xl font-extrabold tabular-nums">
                {vocabCount(p)}
              </div>
              <div className="text-sm text-mute">Kosakata</div>
            </div>
          </Link>
          <Link
            href="/hasil"
            className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 lg:flex-row lg:items-center"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-[#fb923c]/15 text-[#fb923c]">
              <Icon kind="flame" size={22} />
            </span>
            <div>
              <div className="text-2xl font-extrabold tabular-nums">
                {streak(p, now)}{" "}
                <span className="text-base font-semibold text-mute">hari</span>
              </div>
              <div className="text-sm text-mute">Streak</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Lanjutkan belajar */}
      <section className="flex flex-col gap-3">
        <SectionTitle
          action={
            <Link
              href="/latihan"
              className="text-sm font-semibold text-lavender hover:underline"
            >
              Lihat jalur
            </Link>
          }
        >
          Lanjutkan belajar
          <span className="block text-sm font-semibold text-mute">
            {unit.title}
          </span>
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <Link
              key={r.key}
              href={r.href}
              className={`flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-soft ring-1 transition hover:-translate-y-0.5 hover:ring-lavender/40 active:scale-[0.98] ${
                r.key === skill ? "ring-lavender/50" : "ring-transparent"
              }`}
            >
              <Planet
                id={`home-${r.key}`}
                tone={SKILL_TONE[r.key]}
                size={52}
                ring={
                  r.key === "fondasi" ||
                  r.key === "listening" ||
                  r.key === "conversation"
                }
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{r.title}</span>
                  {r.key === skill && (
                    <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-bold text-lavender uppercase">
                      Hari ini
                    </span>
                  )}
                </div>
                <div className="truncate text-sm text-mute">{r.sub}</div>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={r.value} className="h-2 flex-1" />
                  <span className="w-9 text-right text-xs font-semibold text-mute tabular-nums">
                    {Math.round(r.value * 100)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
