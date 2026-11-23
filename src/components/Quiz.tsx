"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { T } from "./T";
import { Button, Feedback, Muted } from "./ui";

/** Soal pilihan ganda berurutan. Memanggil onDone(benar, total) di akhir. */
export function Quiz({
  questions,
  onDone,
}: {
  questions: Question[];
  onDone: (correct: number, total: number) => void;
}) {
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
      <Muted className="font-semibold text-lavender">
        Soal {idx + 1} dari {questions.length}
      </Muted>
      <div className="text-xl font-bold">
        <T romaji={false}>{q.q}</T>
      </div>
      <div className="flex flex-col gap-2">
        {q.options.map((o, i) => {
          const state =
            picked === null
              ? ""
              : i === q.answer
                ? "!border-ok"
                : i === picked
                  ? "!border-bad"
                  : "opacity-50";
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              className={`rounded-2xl border-2 border-transparent bg-surface px-4 py-3.5 text-left font-medium shadow-soft transition hover:border-lavender/40 active:scale-[0.98] ${state}`}
            >
              <T>{o}</T>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <Feedback ok={picked === q.answer}>
            <span
              className={`font-semibold ${picked === q.answer ? "text-ok" : "text-bad"}`}
            >
              {picked === q.answer ? "Benar." : "Belum tepat."}
            </span>{" "}
            {q.explain && <T romaji={false}>{q.explain}</T>}
          </Feedback>
          <Button onClick={next}>
            {idx + 1 >= questions.length ? "Selesai" : "Soal berikutnya"}
          </Button>
        </>
      )}
    </div>
  );
}
