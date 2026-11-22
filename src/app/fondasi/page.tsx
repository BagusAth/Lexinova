"use client";

import { useState } from "react";
import { getUnit } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { skillForDate, SKILL_LABEL } from "@/lib/schedule";
import { speak } from "@/lib/speech";
import { buildQueue, gradeCard, Rating, type Grade } from "@/lib/srs";
import { sameAnswer } from "@/lib/text";
import type { Item } from "@/lib/types";
import { Planet } from "@/components/cosmic";
import { Big, Button, ButtonLink, Card, Chip, Feedback, inputClass, Loading, Muted, ProgressBar, Spacer, TopBar, Verdict } from "@/components/ui";

type Mode = "intro" | "cloze" | "meaning";

const TYPE_LABEL: Record<Item["type"], string> = {
  word: "kata",
  phrasal_verb: "phrasal verb",
  collocation: "kolokasi",
  idiom: "ungkapan",
  pattern: "pola kalimat",
};

const RATINGS: { grade: Grade; label: string }[] = [
  { grade: Rating.Again, label: "Lupa" },
  { grade: Rating.Hard, label: "Sulit" },
  { grade: Rating.Good, label: "Bisa" },
  { grade: Rating.Easy, label: "Mudah" },
];

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
  const nextHref = skill ? `/${skill}` : "/hasil";

  if (idx >= queue.length) {
    return (
      <>
        <TopBar left="Fondasi" />
        <Card className="animate-rise flex flex-col items-center gap-2 py-8 text-center">
          <Planet kind="fondasi" size={72} />
          <Big>{queue.length ? "Fondasi selesai" : "Belum ada kartu jatuh tempo"}</Big>
          <Muted>{queue.length ? `${queue.length} kartu dinilai hari ini.` : "Kartu akan muncul lagi sesuai jadwal review."}</Muted>
        </Card>
        <Spacer />
        <ButtonLink href={nextHref}>{skill ? `Lanjut ke ${SKILL_LABEL[skill]}` : "Lihat hasil hari ini"}</ButtonLink>
        <ButtonLink href="/" variant="alt">
          Kembali ke beranda
        </ButtonLink>
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

  if (mode === "intro") {
    return (
      <div className="stagger flex flex-1 flex-col gap-3">
        <Muted>
          <span className="rounded-full bg-cyan/15 px-2 py-0.5 font-bold text-cyan">Kata baru</span> · {TYPE_LABEL[item.type]}
        </Muted>
        <Big className="text-3xl">{item.term}</Big>
        <div className="font-bold text-moon">{item.meaning}</div>
        <Card>
          <div className="font-semibold">{item.example}</div>
          <Muted>{item.example_id}</Muted>
          <Chip className="mt-3" onClick={() => speak(item.example)}>
            ▶ Dengar
          </Chip>
        </Card>
        {item.note && <Card className="border-lavender/40 bg-elevated text-sm">💡 {item.note}</Card>}
        <Spacer />
        <Button onClick={() => setMode("cloze")}>Coba latihan</Button>
      </div>
    );
  }

  if (mode === "meaning") {
    return (
      <div className="flex flex-1 flex-col gap-3">
        <Muted>Apa artinya?</Muted>
        <Big className="text-3xl">{item.term}</Big>
        {revealed ? (
          <Card className="animate-rise">
            <div className="font-bold text-moon">{item.meaning}</div>
            <div className="mt-1 font-semibold">{item.example}</div>
            <Muted>{item.example_id}</Muted>
          </Card>
        ) : (
          <Button variant="alt" onClick={() => setRevealed(true)}>
            Tampilkan arti
          </Button>
        )}
        <Spacer />
        {revealed && <Rate onGrade={grade} />}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Muted>Lengkapi {TYPE_LABEL[item.type]}</Muted>
      <Big>{item.cloze}</Big>
      <form
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
      </form>
      {revealed ? (
        <Feedback ok={correct}>
          <Verdict ok={correct}>{correct ? "Benar." : `Jawaban: ${item.answer}`}</Verdict> <i>{item.term}</i> = {item.meaning}
          {item.note && <div className="mt-1 text-sm">{item.note}</div>}
          <Muted className="mt-1">Kartu ini muncul lagi sesuai jadwal review.</Muted>
        </Feedback>
      ) : (
        <Button variant="alt" disabled={!input.trim()} onClick={() => setRevealed(true)}>
          Cek
        </Button>
      )}
      <Spacer />
      {revealed && <Rate onGrade={grade} suggestAgain={!correct} />}
    </div>
  );
}

function Rate({ onGrade, suggestAgain = false }: { onGrade: (g: Grade) => void; suggestAgain?: boolean }) {
  return (
    <div className="animate-rise">
      <Muted className="mb-2">Seberapa sulit tadi?</Muted>
      <div className="grid grid-cols-4 gap-1.5">
        {RATINGS.map((r) => {
          const hint = (suggestAgain && r.grade === Rating.Again) || (!suggestAgain && r.grade === Rating.Good);
          return (
            <button
              key={r.grade}
              type="button"
              onClick={() => onGrade(r.grade)}
              className={`rounded-xl py-3 text-sm font-extrabold transition active:scale-95 ${
                hint ? "bg-primary shadow-glow" : "bg-elevated ring-1 ring-line hover:ring-lavender/50"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
