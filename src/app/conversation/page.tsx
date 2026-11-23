"use client";

import { useEffect, useRef, useState } from "react";
import { getUnit } from "@/lib/content";
import { type Difficulty, difficultyOf } from "@/lib/levels";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak, useRecognition } from "@/lib/speech";
import { fuzzyContains } from "@/lib/text";
import type { Conversation } from "@/lib/types";
import {
  Actions,
  ButtonLink,
  inputClass,
  Loading,
  Muted,
  TopBar,
} from "@/components/ui";

export default function ConversationPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  const ex = unit.conversation[0];
  if (!ex) return <Muted>Belum ada materi conversation.</Muted>;
  return (
    <Dialog
      key={ex.id}
      ex={ex}
      autoVoice={p.settings.autoVoice}
      hints={difficultyOf(unit).hints}
    />
  );
}

type Msg = { who: "them" | "me" | "tip"; text: string };

/** Cari balasan yang cocok; kalau tidak ada, pakai fallback supaya dialog tidak macet. */
function route(
  ex: Conversation,
  nodeId: string,
  answer: string,
): { next: string; matched: boolean; feedback?: string } {
  const node = ex.nodes[nodeId];
  for (const r of node.replies ?? []) {
    if (r.match.some((m) => fuzzyContains(answer, m)))
      return { next: r.next, matched: true, feedback: r.feedback };
  }
  return {
    next: node.fallback?.next ?? "end",
    matched: false,
    feedback: node.fallback?.feedback,
  };
}

function Dialog({
  ex,
  autoVoice,
  hints,
}: {
  ex: Conversation;
  autoVoice: boolean;
  hints: Difficulty["hints"];
}) {
  const [hintFor, setHintFor] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState(ex.start);
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "them", text: ex.nodes[ex.start].them },
  ]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [voiceOn, setVoiceOn] = useState(autoVoice);
  const rec = useRecognition("en-US");
  const endRef = useRef<HTMLDivElement>(null);
  const node = ex.nodes[nodeId];
  const finished = !!node.end;

  // Ucapan yang tertangkap mikrofon langsung masuk ke kolom jawaban.
  const shownInput =
    rec.listening || (rec.transcript && !input) ? rec.transcript : input;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  function send() {
    const answer = shownInput.trim();
    if (!answer || finished) return;
    const r = route(ex, nodeId, answer);
    const nextNode = ex.nodes[r.next];
    const add: Msg[] = [{ who: "me", text: answer }];
    if (r.feedback) add.push({ who: "tip", text: r.feedback });
    add.push({ who: "them", text: nextNode.them });
    setMsgs((m) => [...m, ...add]);
    setNodeId(r.next);
    setInput("");
    rec.setTranscript("");
    const s = { c: score.c + (r.matched ? 1 : 0), t: score.t + 1 };
    setScore(s);
    addResult(r.matched ? 1 : 0, 1, r.matched ? 4 : 2);
    if (voiceOn) speak(nextNode.them);
    if (nextNode.end) markDone(ex.id, s.c / s.t);
  }

  return (
    <>
      <TopBar
        left={`Conversation · ${ex.title}`}
        right={`${score.t} balasan`}
      />
      <Muted>
        Kamu: <span className="text-ink">{ex.role_you}</span> · Lawan bicara:{" "}
        <span className="text-ink">{ex.role_them}</span>
      </Muted>

      <div className="flex flex-1 flex-col gap-3">
        {msgs.map((m, i) =>
          m.who === "tip" ? (
            <p
              key={i}
              className="rounded-2xl bg-cyan/10 px-4 py-3 text-sm text-ink/90"
            >
              <span className="text-xs font-bold text-cyan uppercase">
                Contoh jawaban
              </span>
              <br />
              {m.text}
            </p>
          ) : m.who === "them" ? (
            <div key={i} className="max-w-[85%] self-start">
              <div className="rounded-3xl rounded-bl-md bg-surface px-4 py-3 shadow-soft">
                {m.text}
              </div>
              <button
                type="button"
                onClick={() => speak(m.text)}
                className="mt-1 ml-2 text-xs font-semibold text-mute hover:text-lavender"
              >
                Dengar
              </button>
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[85%] self-end rounded-3xl rounded-br-md bg-gradient-to-br from-primary to-[#8b7fff] px-4 py-3 shadow-glow"
            >
              {m.text}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      {finished ? (
        <>
          <Muted>
            Dialog selesai. {score.c} dari {score.t} jawabanmu sesuai yang
            diharapkan.
          </Muted>
          <Actions>
            <ButtonLink href="/" variant="alt">
              Kembali ke beranda
            </ButtonLink>
            <ButtonLink href="/hasil">Lihat hasil hari ini</ButtonLink>
          </Actions>
        </>
      ) : (
        <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-line bg-bg px-5 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:-mx-8 sm:px-8 lg:mx-0 lg:rounded-3xl lg:border lg:bg-surface lg:p-4">
          {hints === "tap" && node.hints && node.hints.length > 0 && hintFor !== nodeId && (
            <button
              type="button"
              onClick={() => setHintFor(nodeId)}
              className="w-fit text-xs font-bold text-lavender hover:underline"
            >
              Butuh ide jawaban?
            </button>
          )}
          {(hints === "show" || (hints === "tap" && hintFor === nodeId)) &&
            node.hints && node.hints.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
              <span className="font-bold text-lavender">Ide:</span>
              {node.hints.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={shownInput}
              onChange={(e) => {
                rec.setTranscript("");
                setInput(e.target.value);
              }}
              placeholder="Ketik atau ucapkan jawabanmu…"
              className={`${inputClass} rounded-full`}
            />
            {rec.supported && (
              <button
                type="button"
                onClick={rec.listening ? rec.stop : rec.start}
                aria-label={rec.listening ? "Berhenti" : "Bicara"}
                className={`grid size-12 shrink-0 place-items-center rounded-full border transition-colors ${
                  rec.listening
                    ? "animate-pulse-ring border-primary bg-primary"
                    : "border-line bg-surface hover:border-lavender/50"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              disabled={!shownInput.trim() || rec.listening}
              className="shrink-0 rounded-full bg-primary px-5 font-bold transition-colors hover:bg-[#7b73ff] disabled:opacity-40"
            >
              Kirim
            </button>
          </form>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-mute">
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={() => setVoiceOn(!voiceOn)}
              className="accent-[#6C63FF]"
            />
            Bacakan balasan lawan bicara
          </label>
        </div>
      )}
    </>
  );
}
