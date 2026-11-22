"use client";

import { useState } from "react";
import { getUnit } from "@/lib/content";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak, useRecognition } from "@/lib/speech";
import { compareWords, countWords } from "@/lib/text";
import type { Speaking } from "@/lib/types";
import { MicButton } from "@/components/Mic";
import { SkillDone } from "@/components/SkillDone";
import { Actions, Big, Button, Card, Chip, Feedback, inputClass, Loading, Muted, ProgressBar, Spacer, TopBar, Verdict } from "@/components/ui";

export default function SpeakingPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const list = getUnit(p.settings.unitId).speaking;
  if (!list.length) return <Muted>Belum ada materi speaking.</Muted>;
  return <SpeakingFlow list={list} />;
}

/** Ratakan semua latihan jadi langkah: satu kalimat shadowing per langkah, satu prompt per langkah. */
type Step = { kind: "shadow"; sentence: string; focus?: string; exId: string } | { kind: "answer"; ex: Extract<Speaking, { mode: "answer" }> };

function SpeakingFlow({ list }: { list: Speaking[] }) {
  const steps: Step[] = list.flatMap((s): Step[] =>
    s.mode === "shadowing" ? s.sentences.map((sentence) => ({ kind: "shadow" as const, sentence, focus: s.focus, exId: s.id })) : [{ kind: "answer" as const, ex: s }],
  );
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState({ c: 0, t: 0 });

  if (idx >= steps.length) {
    return <SkillDone skill="speaking" title="Speaking" detail={`${score.c} dari ${score.t} kata terucap dengan tepat`} />;
  }

  const step = steps[idx];
  const next = (c: number, t: number) => {
    setScore((s) => ({ c: s.c + c, t: s.t + t }));
    if (t > 0) addResult(c, t, Math.round((c / t) * 4) + 1);
    if (idx + 1 >= steps.length) list.forEach((s) => markDone(s.id));
    setIdx(idx + 1);
  };

  return (
    <>
      <TopBar left={`Speaking · ${step.kind === "shadow" ? "shadowing" : "menjawab"}`} right={`${idx + 1} / ${steps.length}`} />
      <ProgressBar value={idx / steps.length} />
      {step.kind === "shadow" ? <Shadow key={idx} sentence={step.sentence} focus={step.focus} onNext={next} /> : <Answer key={idx} ex={step.ex} onNext={next} />}
    </>
  );
}

function Shadow({ sentence, focus, onNext }: { sentence: string; focus?: string; onNext: (c: number, t: number) => void }) {
  const rec = useRecognition("en-US");
  const [typed, setTyped] = useState("");
  const said = rec.supported === false ? typed : rec.transcript;
  const result = said && !rec.listening ? compareWords(sentence, said) : null;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="label">Dengar, lalu ucapkan kalimat ini</div>
      <Big className="sm:text-3xl">{sentence}</Big>
      <Chip className="self-start" onClick={() => speak(sentence)}>
        Dengar contoh
      </Chip>
      {rec.supported === false ? (
        <>
          <Muted className="text-bad">Browser ini belum mendukung pengenalan suara. Coba Chrome atau Edge. Sementara, ketik ucapanmu:</Muted>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} className={inputClass} />
        </>
      ) : (
        <MicButton listening={rec.listening} onStart={rec.start} onStop={rec.stop} disabled={rec.supported === null} />
      )}
      {rec.error && <Muted className="text-bad">{rec.error}</Muted>}
      {rec.listening && rec.transcript && <Muted className="text-center italic">{rec.transcript}</Muted>}
      {result && (
        <Feedback ok={result.correct === result.total}>
          <Muted>Yang tertangkap:</Muted>
          <div className="flex flex-wrap gap-x-1.5">
            {result.tokens.map((t, i) => (
              <span key={i} className={`font-semibold ${t.ok ? "text-ok" : "text-bad"}`}>
                {t.word}
              </span>
            ))}
          </div>
          <Verdict ok={result.correct === result.total}>
            {result.correct} / {result.total} kata
          </Verdict>
          {focus && <Muted className="mt-1">{focus}</Muted>}
        </Feedback>
      )}
      <Spacer />
      {result ? (
        <Actions>
          <Button
            variant="alt"
            onClick={() => {
              rec.setTranscript("");
              setTyped("");
            }}
          >
            Coba lagi
          </Button>
          <Button onClick={() => onNext(result.correct, result.total)}>Lanjut</Button>
        </Actions>
      ) : (
        <Button variant="alt" onClick={() => onNext(0, 0)}>
          Lewati
        </Button>
      )}
    </div>
  );
}

function Answer({ ex, onNext }: { ex: Extract<Speaking, { mode: "answer" }>; onNext: (c: number, t: number) => void }) {
  const rec = useRecognition("en-US");
  const [typed, setTyped] = useState("");
  const [showSample, setShowSample] = useState(false);
  const said = rec.supported === false ? typed : rec.transcript;
  const n = countWords(said);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <p className="border-l-2 border-lavender pl-3">{ex.prompt}</p>
      {rec.supported === false ? (
        <textarea rows={4} value={typed} onChange={(e) => setTyped(e.target.value)} className={inputClass} placeholder="Ketik jawabanmu…" />
      ) : (
        <MicButton listening={rec.listening} onStart={rec.start} onStop={rec.stop} disabled={rec.supported === null} />
      )}
      {said && (
        <Card>
          <Muted>Yang tertangkap ({n} kata):</Muted>
          <div>{said}</div>
        </Card>
      )}
      <Chip className="self-start" onClick={() => setShowSample(!showSample)}>
        {showSample ? "Sembunyikan contoh" : "Lihat contoh jawaban"}
      </Chip>
      {showSample && (
        <Card className="text-sm">
          {ex.sample_answer}
          <Chip className="mt-2" onClick={() => speak(ex.sample_answer)}>
            Dengar
          </Chip>
        </Card>
      )}
      <Spacer />
      <Button onClick={() => onNext(n >= 15 ? 1 : 0, 1)} disabled={!said || rec.listening}>
        Selesai
      </Button>
    </div>
  );
}
