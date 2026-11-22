"use client";

import { useEffect, useState } from "react";
import { getUnit } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { skillForDate, SKILL_LABEL } from "@/lib/schedule";
import { speak } from "@/lib/speech";
import { buildQueue, gradeCard, Rating, type Grade } from "@/lib/srs";
import { sameAnswer } from "@/lib/text";
import type { Item } from "@/lib/types";
import { Actions, Button, ButtonLink, Card, Chip, Feedback, inputClass, Kbd, Loading, Muted, ProgressBar, Spacer, TopBar, Verdict } from "@/components/ui";

type Mode = "intro" | "cloze" | "meaning";

const TYPE_LABEL: Record<Item["type"], string> = {
  word: "kata",
  phrasal_verb: "phrasal verb",
  collocation: "kolokasi",
  idiom: "ungkapan",
  pattern: "pola kalimat",
};

const RATINGS: { grade: Grade; label: string; key: string }[] = [
  { grade: Rating.Again, label: "Lupa", key: "1" },
  { grade: Rating.Hard, label: "Sulit", key: "2" },
  { grade: Rating.Good, label: "Bisa", key: "3" },
  { grade: Rating.Easy, label: "Mudah", key: "4" },
];

/** Pintasan keyboard untuk desktop. Diabaikan saat sedang mengetik di kolom isian. */
function useKey(handler: (key: string) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      handler(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}

export default function Fondasi() {
  const p = useProgress();
  const [queue, setQueue] = useState<{ item: Item; isNew: boolean }[] | null>(null);
  const [idx, setIdx] = useState(0);

  // Antrean diambil sekali saat halaman dibuka, supaya tidak bergeser saat kartu dinilai.
  if (p && queue === null) {
    const q = buildQueue(p, getUnit(p.settings.unitId).items);
    setQueue([...q.due.map((item) => ({ item, isNew: false })), ...q.fresh.map((item) => ({ item, isNew: true }))]);
  }
  if (!p || !queue) return <Loading />;

  const skill = skillForDate();

  if (idx >= queue.length) {
    return (
      <>
        <TopBar left="Fondasi" />
        <Card className="flex flex-col gap-2 p-6">
          <div className="font-display text-2xl">{queue.length ? "Fondasi selesai." : "Belum ada kartu jatuh tempo."}</div>
          <Muted>{queue.length ? `${queue.length} kartu dinilai. Jadwal berikutnya diatur otomatis.` : "Kartu akan muncul lagi sesuai jadwal review."}</Muted>
        </Card>
        <Spacer />
        <Actions>
          <ButtonLink href="/" variant="alt">
            Kembali ke beranda
          </ButtonLink>
          <ButtonLink href={skill ? `/${skill}` : "/latihan"}>{skill ? `Lanjut ke ${SKILL_LABEL[skill]}` : "Pilih latihan"}</ButtonLink>
        </Actions>
      </>
    );
  }

  const { item, isNew } = queue[idx];
  return (
    <>
      <TopBar left="Fondasi" right={`${idx + 1} / ${queue.length}`} />
      <ProgressBar value={idx / queue.length} />
      <CardView key={item.id + idx} item={item} isNew={isNew} reps={p.cards[item.id]?.reps ?? 0} onGraded={() => setIdx(idx + 1)} />
    </>
  );
}

function CardView({ item, isNew, reps, onGraded }: { item: Item; isNew: boolean; reps: number; onGraded: () => void }) {
  const [mode, setMode] = useState<Mode>(isNew ? "intro" : reps % 2 === 0 ? "cloze" : "meaning");
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

  const eyebrow = (
    <div className="label">
      {mode === "intro" ? <span className="text-cyan">Kata baru · </span> : null}
      {TYPE_LABEL[item.type]}
    </div>
  );

  if (mode === "intro") {
    return (
      <div className="flex flex-1 flex-col gap-4">
        {eyebrow}
        <div>
          <div className="font-display text-4xl">{item.term}</div>
          <div className="mt-1 text-lg text-lavender">{item.meaning}</div>
        </div>
        <Card>
          <p>{item.example}</p>
          <Muted className="mt-1">{item.example_id}</Muted>
          <Chip className="mt-3" onClick={() => speak(item.example)}>
            Dengar
          </Chip>
        </Card>
        {item.note && <p className="border-l-2 border-lavender pl-3 text-sm text-mute">{item.note}</p>}
        <Spacer />
        <Button onClick={() => setMode("cloze")}>
          Coba latihan <Kbd>Enter</Kbd>
        </Button>
      </div>
    );
  }

  if (mode === "meaning") {
    return (
      <div className="flex flex-1 flex-col gap-4">
        {eyebrow}
        <div className="font-display text-4xl">{item.term}</div>
        {revealed ? (
          <Card>
            <div className="text-lg text-lavender">{item.meaning}</div>
            <p className="mt-2">{item.example}</p>
            <Muted>{item.example_id}</Muted>
          </Card>
        ) : (
          <Muted>Ingat-ingat artinya, lalu buka untuk mengecek.</Muted>
        )}
        <Spacer />
        {revealed ? (
          <Rate onGrade={grade} />
        ) : (
          <Button variant="alt" onClick={() => setRevealed(true)}>
            Tampilkan arti <Kbd>Spasi</Kbd>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {eyebrow}
      <div className="font-display text-2xl leading-snug sm:text-3xl">{item.cloze}</div>
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
          className={inputClass}
        />
        {!revealed && (
          <button type="submit" disabled={!input.trim()} className="shrink-0 rounded-lg border border-line bg-surface px-4 font-medium transition-colors hover:border-lavender/50 disabled:opacity-40">
            Cek
          </button>
        )}
      </form>
      {revealed && (
        <Feedback ok={correct}>
          <Verdict ok={correct}>{correct ? "Benar." : `Jawabannya: ${item.answer}`}</Verdict>{" "}
          <span className="text-mute">
            <i className="text-ink">{item.term}</i> berarti {item.meaning}.
          </span>
          {item.note && <div className="mt-2 text-sm text-mute">{item.note}</div>}
        </Feedback>
      )}
      <Spacer />
      {revealed && <Rate onGrade={grade} suggestAgain={!correct} />}
    </div>
  );
}

function Rate({ onGrade, suggestAgain = false }: { onGrade: (g: Grade) => void; suggestAgain?: boolean }) {
  useKey((k) => {
    const r = RATINGS.find((x) => x.key === k);
    if (r) onGrade(r.grade);
  });
  return (
    <div>
      <div className="label mb-2">Seberapa mudah kamu mengingatnya?</div>
      <div className="grid grid-cols-4 gap-1.5 md:ml-auto md:max-w-md">
        {RATINGS.map((r) => {
          const hint = (suggestAgain && r.grade === Rating.Again) || (!suggestAgain && r.grade === Rating.Good);
          return (
            <button
              key={r.grade}
              type="button"
              onClick={() => onGrade(r.grade)}
              className={`flex flex-col items-center gap-0.5 rounded-lg border py-2.5 text-sm font-medium transition-colors active:translate-y-px ${
                hint ? "border-primary bg-primary" : "border-line bg-surface hover:border-lavender/50"
              }`}
            >
              {r.label}
              <span className="hidden font-mono text-[10px] text-ink/60 lg:block">{r.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
