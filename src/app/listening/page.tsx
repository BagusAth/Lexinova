"use client";

import { useEffect, useMemo, useState } from "react";
import { getUnit } from "@/lib/content";
import { type Difficulty, difficultyOf } from "@/lib/levels";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak, stopSpeaking } from "@/lib/speech";
import { checkOrder } from "@/lib/exam";
import { isJaMarkup, tileTokens } from "@/lib/ja";
import { seeded, shuffled } from "@/lib/random";
import { buzz, sfx } from "@/lib/sfx";
import { compareWords, normalize } from "@/lib/text";
import { T } from "@/components/T";
import { TileBoard } from "@/components/Tiles";
import type { Listening } from "@/lib/types";
import { Quiz } from "@/components/Quiz";
import { SkillDone } from "@/components/SkillDone";
import {
  Button,
  Card,
  Chip,
  Feedback,
  inputClass,
  Loading,
  Muted,
  ProgressBar,
  Spacer,
  TopBar,
  Verdict,
} from "@/components/ui";

type Phase = "listen" | "dictation" | "quiz" | "done";

export default function ListeningPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  const ex = unit.listening[0];
  if (!ex) return <Muted>Belum ada materi listening.</Muted>;
  return <ListeningExercise key={ex.id} ex={ex} diff={difficultyOf(unit)} />;
}

function ListeningExercise({ ex, diff }: { ex: Listening; diff: Difficulty }) {
  const [phase, setPhase] = useState<Phase>("listen");
  const [rate, setRate] = useState(diff.rates.includes(1) ? 1 : diff.rates[0]);
  const [playing, setPlaying] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const [dIdx, setDIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const voiceOf = (speaker: string) =>
    ex.speakers.find((s) => s.name === speaker)?.voice ?? "en-US";

  async function playAll() {
    stopSpeaking();
    for (let i = 0; i < ex.lines.length; i++) {
      setPlaying(i);
      await speak(ex.lines[i].text, {
        lang: voiceOf(ex.lines[i].speaker),
        rate,
      });
    }
    setPlaying(null);
  }

  const steps = ex.dictation.length + 2;
  const stepNow =
    phase === "listen"
      ? 0
      : phase === "dictation"
        ? 1 + dIdx
        : phase === "quiz"
          ? steps - 1
          : steps;

  if (phase === "done")
    return (
      <SkillDone
        skill="listening"
        title="Listening"
        detail={`${ex.title} · ${score.correct} dari ${score.total} benar`}
      />
    );

  return (
    <>
      <TopBar
        left="Listening"
        right={`${Math.min(stepNow + 1, steps)} / ${steps}`}
      />
      <ProgressBar value={stepNow / steps} />

      {phase === "listen" && (
        <div className="flex flex-1 flex-col gap-3">
          <Muted>Dengarkan dialognya dulu</Muted>
          <div className="text-2xl font-extrabold">{ex.title}</div>
          <button
            type="button"
            onClick={playAll}
            aria-label="Putar dialog"
            className={`mx-auto my-4 grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-[#8b7fff] shadow-glow transition hover:brightness-110 active:scale-90 ${playing !== null ? "animate-pulse-ring" : ""}`}
          >
            <svg width="36" height="36" viewBox="0 0 24 24">
              <path d="M7 4l13 8-13 8z" fill="#F4F3FF" />
            </svg>
          </button>
          <RateChips rates={diff.rates} rate={rate} setRate={setRate} />
          {diff.transcript ? (
            <Chip className="self-center" onClick={() => setShowText(!showText)}>
              {showText ? "Sembunyikan teks" : "Tampilkan teks"}
            </Chip>
          ) : (
            <Muted className="text-center">
              Di tingkat ini transkrip disembunyikan. Andalkan telingamu.
            </Muted>
          )}
          {showText && (
            <Card className="flex flex-col gap-1.5 text-sm">
              {ex.lines.map((l, i) => (
                <div
                  key={i}
                  className={`transition ${playing === i ? "text-cyan" : ""}`}
                >
                  <b>{l.speaker}:</b> <T>{l.text}</T>
                </div>
              ))}
            </Card>
          )}
          <Spacer />
          <Button onClick={() => (stopSpeaking(), setPhase("dictation"))}>
            Lanjut ke dikte
          </Button>
        </div>
      )}

      {phase === "dictation" && isJaMarkup(ex.lines[ex.dictation[dIdx]].text) && (
        <DictationTiles
          key={dIdx}
          line={ex.lines[ex.dictation[dIdx]]}
          others={ex.lines.map((l) => l.text)}
          distractors={diff.orderDistractors}
          rates={diff.rates}
          rate={rate}
          setRate={setRate}
          onNext={(c, t) => {
            setScore((s) => ({ correct: s.correct + c, total: s.total + t }));
            addResult(c, t, c * 5);
            if (dIdx + 1 < ex.dictation.length) setDIdx(dIdx + 1);
            else setPhase("quiz");
          }}
        />
      )}

      {phase === "dictation" && !isJaMarkup(ex.lines[ex.dictation[dIdx]].text) && (
        <Dictation
          key={dIdx}
          line={ex.lines[ex.dictation[dIdx]]}
          lang={voiceOf(ex.lines[ex.dictation[dIdx]].speaker)}
          rates={diff.rates}
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

function RateChips({
  rates,
  rate,
  setRate,
}: {
  rates: number[];
  rate: number;
  setRate: (r: number) => void;
}) {
  if (rates.length < 2) return null;
  return (
    <div className="flex justify-center gap-2">
      {rates.map((r) => (
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
  rates,
  rate,
  setRate,
  onNext,
}: {
  line: { speaker: string; text: string };
  lang: string;
  rates: number[];
  rate: number;
  setRate: (r: number) => void;
  onNext: (correct: number, total: number) => void;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof compareWords> | null>(
    null,
  );

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Muted>Dengar, lalu ketik yang diucapkan {line.speaker}</Muted>
      <button
        type="button"
        onClick={() => speak(line.text, { lang, rate })}
        aria-label="Putar kalimat"
        className="mx-auto my-3 grid size-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[#8b7fff] shadow-glow transition hover:brightness-110 active:scale-90"
      >
        <svg width="30" height="30" viewBox="0 0 24 24">
          <path d="M7 4l13 8-13 8z" fill="#F4F3FF" />
        </svg>
      </button>
      <RateChips rates={rates} rate={rate} setRate={setRate} />
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
              <span
                key={i}
                className={t.ok ? "text-ok" : "rounded bg-bad/20 px-1 text-bad"}
              >
                {t.word}
              </span>
            ))}
          </div>
          <Muted className="mt-2">{line.text}</Muted>
        </Feedback>
      )}
      <Spacer />
      {result ? (
        <Button onClick={() => onNext(result.correct, result.total)}>
          Lanjut
        </Button>
      ) : (
        <Button
          disabled={!input.trim()}
          onClick={() => setResult(compareWords(line.text, input))}
        >
          Cek
        </Button>
      )}
    </div>
  );
}

/** Dikte Jepang ala Duolingo: dengar, lalu susun ubin kata (tanpa keyboard Jepang). */
function DictationTiles({
  line,
  others,
  distractors,
  rates,
  rate,
  setRate,
  onNext,
}: {
  line: { speaker: string; text: string };
  others: string[];
  distractors: number;
  rates: number[];
  rate: number;
  setRate: (r: number) => void;
  onNext: (correct: number, total: number) => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const tiles = useMemo(() => {
    const own = tileTokens(line.text);
    const keys = new Set(own.map((t) => normalize(t)));
    const rng = seeded(line.text);
    const extra = shuffled(
      [...new Set(others.flatMap((o) => tileTokens(o)).filter((t) => !keys.has(normalize(t))))],
      rng,
    ).slice(0, distractors);
    return shuffled([...own, ...extra], rng);
  }, [line.text, others, distractors]);

  useEffect(() => {
    speak(line.text, { rate });
    // Putar sekali saat kalimat baru muncul.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.text]);

  function check() {
    const good = checkOrder(
      picked.map((i) => tiles[i]),
      line.text,
    );
    setOk(good);
    sfx(good ? "correct" : "wrong");
    if (!good) buzz();
  }

  return (
    <div className="animate-card-in flex flex-1 flex-col gap-3">
      <Muted>Dengar, lalu susun yang diucapkan {line.speaker}</Muted>
      <button
        type="button"
        onClick={() => speak(line.text, { rate })}
        aria-label="Putar kalimat"
        className="mx-auto my-3 grid size-16 place-items-center rounded-full bg-gradient-to-br from-primary to-[#8b7fff] shadow-[0_4px_0_#3d358f] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
      >
        <svg width="30" height="30" viewBox="0 0 24 24">
          <path d="M7 4l13 8-13 8z" fill="#F4F3FF" />
        </svg>
      </button>
      <RateChips rates={rates} rate={rate} setRate={setRate} />
      <TileBoard tiles={tiles} value={picked} onChange={setPicked} locked={ok !== null} />
      {ok !== null && (
        <div
          role="status"
          className={`animate-slide-up rounded-3xl p-4 ring-1 ${ok ? "bg-ok/10 ring-ok/40" : "bg-bad/10 ring-bad/40"}`}
        >
          <Verdict ok={ok}>{ok ? "Benar!" : "Belum tepat"}</Verdict>
          <div className="mt-1 text-lg">
            <T>{line.text}</T>
          </div>
        </div>
      )}
      <Spacer />
      {ok === null ? (
        <Button disabled={!picked.length} onClick={check}>
          Cek
        </Button>
      ) : (
        <Button onClick={() => onNext(ok ? 1 : 0, 1)} autoFocus>
          Lanjut
        </Button>
      )}
    </div>
  );
}
