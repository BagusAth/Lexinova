"use client";

import { useState } from "react";
import { getUnit } from "@/lib/content";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import type { GrammarPoint } from "@/lib/types";
import { Icon } from "@/components/cosmic";
import { SkillDone } from "@/components/SkillDone";
import {
  Button,
  Card,
  Chip,
  Feedback,
  Loading,
  Muted,
  ProgressBar,
  Spacer,
  TopBar,
} from "@/components/ui";

export default function TataBahasaPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  if (!unit.grammar.length) return <Muted>Unit ini belum punya poin tata bahasa.</Muted>;
  return <GrammarLesson key={unit.id} points={unit.grammar} unitTitle={unit.title} />;
}

/** Urutan pilihan dibuat tetap per poin (bukan acak), supaya tampilan stabil saat render ulang. */
function options(g: GrammarPoint): string[] {
  const { wrong, right } = g.common_mistake;
  const flip = [...g.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0;
  return flip ? [right, wrong] : [wrong, right];
}

function GrammarLesson({
  points,
  unitTitle,
}: {
  points: GrammarPoint[];
  unitTitle: string;
}) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"learn" | "check">("learn");
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  if (idx >= points.length)
    return (
      <SkillDone
        skill="grammar"
        title="Tata bahasa"
        detail={`${unitTitle} · ${correct} dari ${points.length} cek benar`}
      />
    );

  const g = points[idx];
  const total = points.length * 2;
  const step = idx * 2 + (phase === "check" ? 1 : 0);
  const ok = picked === g.common_mistake.right;

  function next() {
    const c = correct + (ok ? 1 : 0);
    setCorrect(c);
    if (idx + 1 >= points.length) {
      points.forEach((x) => markDone(x.id));
      addResult(c, points.length, c * 3 + 2);
    }
    setIdx(idx + 1);
    setPhase("learn");
    setPicked(null);
  }

  return (
    <>
      <TopBar left="Tata bahasa" right={`${idx + 1} / ${points.length}`} />
      <ProgressBar value={step / total} />

      {phase === "learn" ? (
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <Muted className="font-semibold text-lavender">Poin {idx + 1}</Muted>
            <h2 className="text-2xl font-extrabold">{g.title}</h2>
          </div>
          <p className="leading-relaxed text-ink/90">{g.explanation}</p>

          <Card className="flex flex-col gap-2">
            <div className="text-sm font-bold text-mute">Contoh</div>
            {g.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => speak(ex)}
                className="flex items-start gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-elevated"
              >
                <Icon kind="volume" size={18} className="mt-0.5 text-lavender" />
                <span>{ex}</span>
              </button>
            ))}
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="text-sm font-bold text-mute">Kesalahan umum</div>
            <div className="flex items-start gap-2 text-bad">
              <Icon kind="x" size={18} className="mt-0.5" strokeWidth={2.4} />
              <span className="line-through decoration-bad/60">{g.common_mistake.wrong}</span>
            </div>
            <div className="flex items-start gap-2 text-ok">
              <Icon kind="check" size={18} className="mt-0.5" strokeWidth={2.4} />
              <span>{g.common_mistake.right}</span>
            </div>
          </Card>

          <Spacer />
          <Button onClick={() => setPhase("check")}>Cek pemahaman</Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <Muted className="font-semibold text-lavender">{g.title}</Muted>
          <div className="text-xl font-bold">Pilih kalimat yang benar</div>
          <div className="flex flex-col gap-2">
            {options(g).map((o) => {
              const state =
                picked === null
                  ? "border-transparent hover:border-lavender/50"
                  : o === g.common_mistake.right
                    ? "border-ok"
                    : o === picked
                      ? "border-bad"
                      : "border-transparent opacity-50";
              return (
                <button
                  key={o}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => setPicked(o)}
                  className={`rounded-2xl border-2 bg-surface px-4 py-3.5 text-left font-medium shadow-soft transition active:scale-[0.98] ${state}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <Feedback ok={ok}>
              <span className={`font-bold ${ok ? "text-ok" : "text-bad"}`}>
                {ok ? "Benar!" : "Belum tepat."}
              </span>{" "}
              {ok ? "Kamu menghindari kesalahan yang umum." : `Yang benar: ${g.common_mistake.right}`}
              <div className="mt-2">
                <Chip onClick={() => speak(g.common_mistake.right)}>
                  <Icon kind="volume" size={16} /> Dengar
                </Chip>
              </div>
            </Feedback>
          )}
          <Spacer />
          {picked !== null && (
            <Button onClick={next} autoFocus>
              {idx + 1 >= points.length ? "Selesai" : "Poin berikutnya"}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
