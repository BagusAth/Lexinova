"use client";

import { useEffect, useState } from "react";
import { getUnit } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { skillForDate, SKILL_LABEL } from "@/lib/schedule";
import { speak } from "@/lib/speech";
import { buildQueue, gradeCard, Rating, type Grade } from "@/lib/srs";
import { sameAnswer } from "@/lib/text";
import type { Item } from "@/lib/types";
import { Icon, type IconKind, Planet, Sparkle } from "@/components/cosmic";
import {
  Actions,
  Button,
  ButtonLink,
  Kbd,
  Loading,
  ProgressBar,
  Spacer,
  TopBar,
} from "@/components/ui";

type Mode = "intro" | "cloze" | "meaning";

const TYPE_LABEL: Record<Item["type"], string> = {
  word: "kata",
  phrasal_verb: "phrasal verb",
  collocation: "kolokasi",
  idiom: "ungkapan",
  pattern: "pola kalimat",
};

const RATINGS: {
  grade: Grade;
  label: string;
  key: string;
  icon: IconKind;
  tone: string;
}[] = [
  {
    grade: Rating.Again,
    label: "Lupa",
    key: "1",
    icon: "x",
    tone: "bg-bad/15 text-bad ring-bad/40 hover:bg-bad/25",
  },
  {
    grade: Rating.Hard,
    label: "Sulit",
    key: "2",
    icon: "redo",
    tone: "bg-[#fb923c]/15 text-[#fdba74] ring-[#fb923c]/40 hover:bg-[#fb923c]/25",
  },
  {
    grade: Rating.Good,
    label: "Bisa",
    key: "3",
    icon: "check",
    tone: "bg-ok/15 text-ok ring-ok/40 hover:bg-ok/25",
  },
  {
    grade: Rating.Easy,
    label: "Mudah",
    key: "4",
    icon: "star",
    tone: "bg-primary/20 text-lavender ring-lavender/40 hover:bg-primary/30",
  },
];

/** Pintasan keyboard untuk desktop. Diabaikan saat sedang mengetik di kolom isian. */
function useKey(handler: (key: string) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key === " ") e.preventDefault();
      handler(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}

export default function Fondasi() {
  const p = useProgress();
  const [queue, setQueue] = useState<{ item: Item; isNew: boolean }[] | null>(
    null,
  );
  const [idx, setIdx] = useState(0);

  // Antrean diambil sekali saat halaman dibuka, supaya tidak bergeser saat kartu dinilai.
  if (p && queue === null) {
    const q = buildQueue(p, getUnit(p.settings.unitId).items);
    setQueue([
      ...q.due.map((item) => ({ item, isNew: false })),
      ...q.fresh.map((item) => ({ item, isNew: true })),
    ]);
  }
  if (!p || !queue) return <Loading />;

  const skill = skillForDate();

  if (idx >= queue.length) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6">
        <TopBar left="Fondasi" />
        <div className="card-nebula relative flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] px-6 py-10 text-center">
          <Sparkle className="absolute top-6 left-10" />
          <Sparkle
            className="absolute right-12 bottom-10"
            size={10}
            delay={1}
          />
          <Planet id="done-fondasi" tone="lavender" size={110} />
          <h2 className="text-2xl font-extrabold">
            {queue.length ? "Fondasi selesai!" : "Semua kartu sudah beres"}
          </h2>
          <p className="text-ink/80">
            {queue.length
              ? `${queue.length} kartu sudah kamu nilai. Jadwal ulangnya diatur otomatis.`
              : "Kartu akan muncul lagi sesuai jadwal review."}
          </p>
        </div>
        <Spacer />
        <Actions>
          <ButtonLink href="/" variant="alt">
            Ke beranda
          </ButtonLink>
          <ButtonLink href={skill ? `/${skill}` : "/latihan"}>
            {skill ? `Lanjut ke ${SKILL_LABEL[skill]}` : "Jelajahi latihan"}
          </ButtonLink>
        </Actions>
      </div>
    );
  }

  const { item, isNew } = queue[idx];
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5">
      <div className="flex items-center gap-3">
        <TopBar left="" />
        <ProgressBar value={idx / queue.length} className="flex-1" />
        <span className="text-sm font-bold text-lavender tabular-nums">
          {idx + 1}/{queue.length}
        </span>
      </div>
      <CardView
        key={item.id + idx}
        item={item}
        isNew={isNew}
        reps={p.cards[item.id]?.reps ?? 0}
        onGraded={() => setIdx(idx + 1)}
      />
    </div>
  );
}

function CardView({
  item,
  isNew,
  reps,
  onGraded,
}: {
  item: Item;
  isNew: boolean;
  reps: number;
  onGraded: () => void;
}) {
  const [mode, setMode] = useState<Mode>(
    isNew ? "intro" : reps % 2 === 0 ? "cloze" : "meaning",
  );
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const correct = sameAnswer(input, item.answer);

  function grade(g: Grade) {
    gradeCard(item.id, g);
    onGraded();
  }

  useKey((k) => {
    if (k !== "Enter" && k !== " ") return;
    if (mode === "intro") setMode("cloze");
    else if (mode === "meaning" && !revealed) setRevealed(true);
  });

  const showBack = mode === "intro" || revealed;

  return (
    <>
      {/* Kartu besar */}
      <div className="relative overflow-hidden rounded-[2rem] bg-surface shadow-soft ring-1 ring-line">
        <div className="card-nebula relative flex h-36 items-center justify-center overflow-hidden">
          <Sparkle className="absolute top-5 left-8" size={12} />
          <Sparkle
            className="absolute top-10 right-12"
            size={9}
            color="#7DD3FC"
            delay={0.8}
          />
          <Sparkle
            className="absolute bottom-6 left-1/4"
            size={8}
            delay={1.6}
          />
          <div className="animate-float">
            <Planet
              id="flash"
              tone={mode === "cloze" ? "cyan" : "violet"}
              size={104}
            />
          </div>
          <span className="absolute top-4 right-4 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {mode === "intro"
              ? "Kata baru"
              : mode === "cloze"
                ? "Isi celah"
                : "Ingat arti"}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-6">
          {mode === "cloze" ? (
            <>
              <span className="w-fit rounded-full bg-elevated px-3 py-1 text-xs font-semibold text-lavender">
                {TYPE_LABEL[item.type]}
              </span>
              <p className="text-xl leading-relaxed font-bold sm:text-2xl">
                {item.cloze}
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (input.trim()) setRevealed(true);
                }}
              >
                <input
                  autoFocus
                  autoCapitalize="off"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={revealed}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik jawaban…"
                  className={`w-full rounded-full border-2 bg-elevated/60 px-5 py-3 outline-none transition focus:border-lavender ${
                    revealed
                      ? correct
                        ? "border-ok text-ok"
                        : "border-bad text-bad"
                      : "border-line"
                  }`}
                />
                {!revealed && (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="shrink-0 rounded-full bg-primary px-6 font-bold transition hover:brightness-110 active:scale-95 disabled:opacity-40"
                  >
                    Cek
                  </button>
                )}
              </form>
              {revealed && (
                <div className="animate-rise flex flex-col gap-1">
                  <p
                    className={`font-bold ${correct ? "text-ok" : "text-bad"}`}
                  >
                    {correct ? "Benar!" : `Jawabannya: ${item.answer}`}
                  </p>
                  <p>
                    <span className="font-bold">{item.term}</span>{" "}
                    <span className="text-mute">· {item.meaning}</span>
                  </p>
                  {item.note && (
                    <p className="text-sm text-mute">{item.note}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-elevated px-3 py-1 text-xs font-semibold text-lavender">
                    {TYPE_LABEL[item.type]}
                  </span>
                  <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                    {item.term}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => speak(item.term)}
                  aria-label="Dengar pengucapan"
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/20 text-lavender transition hover:bg-primary/30 active:scale-90"
                >
                  <Icon kind="volume" size={22} />
                </button>
              </div>

              {showBack ? (
                <div className="animate-rise flex flex-col gap-3">
                  <p className="text-lg font-semibold text-lavender">
                    {item.meaning}
                  </p>
                  <div className="rounded-2xl bg-elevated/60 p-4">
                    <p className="font-medium">&ldquo;{item.example}&rdquo;</p>
                    <p className="mt-1 text-sm text-mute">{item.example_id}</p>
                    <button
                      type="button"
                      onClick={() => speak(item.example)}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-lavender hover:underline"
                    >
                      <Icon kind="volume" size={16} /> Dengar contoh
                    </button>
                  </div>
                  {item.note && (
                    <p className="rounded-2xl bg-[#fcd34d]/10 px-4 py-3 text-sm text-[#fde68a]">
                      <span className="font-bold">Catatan: </span>
                      {item.note}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="rounded-2xl border-2 border-dashed border-line py-8 text-mute transition hover:border-lavender/50 hover:text-ink"
                >
                  Ketuk untuk melihat arti <Kbd>Spasi</Kbd>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <Spacer />

      {mode === "intro" ? (
        <Button className="md:self-center" onClick={() => setMode("cloze")}>
          Coba latihan <Kbd>Enter</Kbd>
        </Button>
      ) : (
        revealed && (
          <Rate
            onGrade={grade}
            suggest={mode === "cloze" && !correct ? Rating.Again : Rating.Good}
          />
        )
      )}
    </>
  );
}

function Rate({
  onGrade,
  suggest,
}: {
  onGrade: (g: Grade) => void;
  suggest: Grade;
}) {
  useKey((k) => {
    const r = RATINGS.find((x) => x.key === k);
    if (r) onGrade(r.grade);
  });
  return (
    <div className="animate-rise flex flex-col items-center gap-3">
      <p className="text-sm text-mute">Seberapa mudah kamu mengingatnya?</p>
      <div className="flex justify-center gap-4 sm:gap-6">
        {RATINGS.map((r) => (
          <button
            key={r.grade}
            type="button"
            onClick={() => onGrade(r.grade)}
            className="group flex flex-col items-center gap-1.5"
          >
            <span
              className={`grid size-16 place-items-center rounded-full ring-2 transition group-active:scale-90 ${r.tone} ${
                r.grade === suggest ? "scale-110 ring-4" : ""
              }`}
            >
              <Icon kind={r.icon} size={26} strokeWidth={2.4} />
            </span>
            <span className="text-xs font-semibold text-mute">
              {r.label} <Kbd>{r.key}</Kbd>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
