"use client";

import { useState } from "react";
import { getUnit } from "@/lib/content";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak, stopSpeaking } from "@/lib/speech";
import { compareWords } from "@/lib/text";
import type { Listening } from "@/lib/types";
import { Quiz } from "@/components/Quiz";
import { SkillDone } from "@/components/SkillDone";
import { Button, Card, Chip, Feedback, inputClass, Loading, Muted, ProgressBar, Spacer, TopBar, Verdict } from "@/components/ui";

type Phase = "listen" | "dictation" | "quiz" | "done";

export default function ListeningPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const ex = getUnit(p.settings.unitId).listening[0];
  if (!ex) return <Muted>Belum ada materi listening.</Muted>;
  return <ListeningExercise ex={ex} />;
}

function ListeningExercise({ ex }: { ex: Listening }) {
  const [phase, setPhase] = useState<Phase>("listen");
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const [dIdx, setDIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const voiceOf = (speaker: string) => ex.speakers.find((s) => s.name === speaker)?.voice ?? "en-US";

  async function playAll() {
    stopSpeaking();
    for (let i = 0; i < ex.lines.length; i++) {
      setPlaying(i);
      await speak(ex.lines[i].text, { lang: voiceOf(ex.lines[i].speaker), rate });
    }
    setPlaying(null);
  }

  const steps = ex.dictation.length + 2;
  const stepNow = phase === "listen" ? 0 : phase === "dictation" ? 1 + dIdx : phase === "quiz" ? steps - 1 : steps;

  if (phase === "done") return <SkillDone skill="listening" title="Listening" detail={`${ex.title} · ${score.correct} dari ${score.total} benar`} />;

  return (
    <>
      <TopBar left="Listening" right={`${Math.min(stepNow + 1, steps)} / ${steps}`} />
      <ProgressBar value={stepNow / steps} />

      {phase === "listen" && (
        <div className="stagger flex flex-1 flex-col gap-3">
          <Muted>Dengarkan dialognya dulu</Muted>
          <div className="font-display text-xl font-bold">{ex.title}</div>
          <button
            type="button"
            onClick={playAll}
            aria-label="Putar dialog"
            className={`mx-auto my-2 grid size-24 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan/80 shadow-glow transition active:scale-90 ${playing !== null ? "animate-pulse-ring" : ""}`}
          >
            <svg width="36" height="36" viewBox="0 0 24 24">
              <path d="M7 4l13 8-13 8z" fill="#F4F3FF" />
            </svg>
          </button>
          <RateChips rate={rate} setRate={setRate} />
          <Chip className="self-center" onClick={() => setShowText(!showText)}>
            {showText ? "Sembunyikan teks" : "Tampilkan teks"}
          </Chip>
          {showText && (
            <Card className="flex flex-col gap-1.5 text-sm">
              {ex.lines.map((l, i) => (
                <div key={i} className={`transition ${playing === i ? "text-cyan" : ""}`}>
                  <b>{l.speaker}:</b> {l.text}
                </div>
              ))}
            </Card>
          )}
          <Spacer />
          <Button onClick={() => (stopSpeaking(), setPhase("dictation"))}>Lanjut ke dikte</Button>
        </div>
      )}

      {phase === "dictation" && (
        <Dictation
          key={dIdx}
          line={ex.lines[ex.dictation[dIdx]]}
          lang={voiceOf(ex.lines[ex.dictation[dIdx]].speaker)}
          rate={rate}
          setRate={setRate}
          onNext={(c, t) => {
            setScore((s) => ({ correct: s.correct + c, total: s.total + t }));
            addResult(c, t, Math.round((c / t) * 5));
            if (dIdx + 1 < ex.dictation.length) setDIdx(dIdx + 1);
            else setPhase("quiz");
          }}
        />
      )}

      {phase === "quiz" && (
        <Quiz
          questions={ex.questions}
          onDone={(c, t) => {
            addResult(c, t, c * 3);
            markDone(ex.id, c / t);
            setScore((s) => ({ correct: s.correct + c, total: s.total + t }));
            setPhase("done");
          }}
        />
      )}
    </>
  );
}

function RateChips({ rate, setRate }: { rate: number; setRate: (r: number) => void }) {
  return (
    <div className="flex justify-center gap-2">
      {[0.75, 1].map((r) => (
        <Chip key={r} active={rate === r} onClick={() => setRate(r)}>
          {r}x
        </Chip>
      ))}
    </div>
  );
}

function Dictation({
  line,
  lang,
  rate,
  setRate,
  onNext,
}: {
  line: { speaker: string; text: string };
  lang: string;
  rate: number;
  setRate: (r: number) => void;
  onNext: (correct: number, total: number) => void;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof compareWords> | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Muted>Dengar, lalu ketik yang diucapkan {line.speaker}</Muted>
      <button
        type="button"
        onClick={() => speak(line.text, { lang, rate })}
        aria-label="Putar kalimat"
        className="mx-auto my-1 grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan/80 shadow-glow transition active:scale-90"
      >
        <svg width="30" height="30" viewBox="0 0 24 24">
          <path d="M7 4l13 8-13 8z" fill="#F4F3FF" />
        </svg>
      </button>
      <RateChips rate={rate} setRate={setRate} />
      <textarea
        rows={3}
        value={input}
        disabled={!!result}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ketik kalimat yang kamu dengar…"
        autoCapitalize="off"
        spellCheck={false}
        className={inputClass}
      />
      {result && (
        <Feedback ok={result.correct === result.total}>
          <Verdict ok={result.correct === result.total}>
            {result.correct} dari {result.total} kata tepat.
          </Verdict>
          <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1">
            {result.tokens.map((t, i) => (
              <span key={i} className={t.ok ? "text-ok" : "rounded bg-bad/20 px-1 text-bad"}>
                {t.word}
              </span>
            ))}
          </div>
          <Muted className="mt-2">{line.text}</Muted>
        </Feedback>
      )}
      <Spacer />
      {result ? (
        <Button onClick={() => onNext(result.correct, result.total)}>Lanjut</Button>
      ) : (
        <Button disabled={!input.trim()} onClick={() => setResult(compareWords(line.text, input))}>
          Cek
        </Button>
      )}
    </div>
  );
}
