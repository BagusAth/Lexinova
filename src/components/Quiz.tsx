"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { Button, Feedback, Muted } from "./ui";

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
      <Muted className="label">
        Soal {idx + 1} dari {questions.length}
      </Muted>
      <div className="font-display text-lg">{q.q}</div>
      <div className="flex flex-col gap-2">
        {q.options.map((o, i) => {
          const state = picked === null ? "" : i === q.answer ? "!border-ok" : i === picked ? "!border-bad" : "opacity-50";
          return (
            <button key={i} type="button" onClick={() => pick(i)} className={`rounded-lg border border-line bg-surface p-3.5 text-left transition-colors hover:border-lavender/50 ${state}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <Feedback ok={picked === q.answer}>
            <span className={`font-semibold ${picked === q.answer ? "text-ok" : "text-bad"}`}>{picked === q.answer ? "Benar." : "Belum tepat."}</span>{" "}
            {q.explain}
          </Feedback>
          <Button onClick={next}>{idx + 1 >= questions.length ? "Selesai" : "Soal berikutnya"}</Button>
        </>
      )}
    </div>
  );
}
