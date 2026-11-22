"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { Button, Card, Muted } from "./ui";

/** Soal pilihan ganda berurutan. Memanggil onDone(benar, total) di akhir. */
export function Quiz({ questions, onDone }: { questions: Question[]; onDone: (correct: number, total: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = questions[idx];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  }

  function next() {
    if (idx + 1 >= questions.length) {
      onDone(correct, questions.length);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <Muted>
        Soal {idx + 1} dari {questions.length}
      </Muted>
      <div className="font-display text-lg font-bold">{q.q}</div>
      <div className="flex flex-col gap-2">
        {q.options.map((o, i) => {
          const state = picked === null ? "" : i === q.answer ? "!border-ok bg-ok/10" : i === picked ? "!border-bad bg-bad/10" : "opacity-50";
          return (
            <button key={i} type="button" onClick={() => pick(i)} className={`rounded-2xl border border-line bg-surface/85 p-3.5 text-left font-semibold transition active:scale-[0.98] hover:border-lavender/60 ${state}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <Card className={picked === q.answer ? "border-ok" : "border-bad"}>
            <span className={`font-extrabold ${picked === q.answer ? "text-ok" : "text-bad"}`}>{picked === q.answer ? "Benar." : "Belum tepat."}</span>{" "}
            {q.explain}
          </Card>
          <Button onClick={next}>{idx + 1 >= questions.length ? "Selesai" : "Soal berikutnya"}</Button>
        </>
      )}
    </div>
  );
}
