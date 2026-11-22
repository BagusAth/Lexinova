"use client";

import { useEffect, useRef, useState } from "react";
import { getUnit } from "@/lib/content";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak, useRecognition } from "@/lib/speech";
import { fuzzyContains } from "@/lib/text";
import type { Conversation } from "@/lib/types";
import { Button, ButtonLink, Chip, inputClass, Loading, Muted, TopBar } from "@/components/ui";

export default function ConversationPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const ex = getUnit(p.settings.unitId).conversation[0];
  if (!ex) return <Muted>Belum ada materi conversation.</Muted>;
  return <Dialog ex={ex} />;
}

type Msg = { who: "them" | "me" | "tip"; text: string };

/** Cari balasan yang cocok; kalau tidak ada, pakai fallback supaya dialog tidak macet. */
function route(ex: Conversation, nodeId: string, answer: string): { next: string; matched: boolean; feedback?: string } {
  const node = ex.nodes[nodeId];
  for (const r of node.replies ?? []) {
    if (r.match.some((m) => fuzzyContains(answer, m))) return { next: r.next, matched: true, feedback: r.feedback };
  }
  return { next: node.fallback?.next ?? "end", matched: false, feedback: node.fallback?.feedback };
}

function Dialog({ ex }: { ex: Conversation }) {
  const [nodeId, setNodeId] = useState(ex.start);
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "them", text: ex.nodes[ex.start].them }]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [voiceOn, setVoiceOn] = useState(true);
  const rec = useRecognition("en-US");
  const endRef = useRef<HTMLDivElement>(null);
  const node = ex.nodes[nodeId];
  const finished = !!node.end;

  // Ucapan yang tertangkap mikrofon langsung masuk ke kolom jawaban.
  const shownInput = rec.listening || (rec.transcript && !input) ? rec.transcript : input;

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
      <TopBar left={`Conversation · ${ex.title}`} right={`${score.t} balasan`} />
      <Muted>
        Kamu: <b className="text-ink">{ex.role_you}</b> · Lawan bicara: <b className="text-ink">{ex.role_them}</b>
      </Muted>

      <div className="flex flex-1 flex-col gap-2.5">
        {msgs.map((m, i) =>
          m.who === "tip" ? (
            <div key={i} className="animate-rise mx-2 rounded-xl border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-cyan">
              💡 {m.text}
            </div>
          ) : (
            <div
              key={i}
              className={`animate-rise max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                m.who === "them" ? "rounded-bl-sm border border-line bg-surface" : "ml-auto rounded-br-sm bg-gradient-to-br from-primary to-[#8a7dff]"
              }`}
            >
              {m.who === "them" && (
                <button type="button" onClick={() => speak(m.text)} className="float-right ml-2 text-xs text-lavender" aria-label="Dengar">
                  ▶
                </button>
              )}
              {m.text}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      {finished ? (
        <div className="flex flex-col gap-2">
          <Muted className="text-center">
            Dialog selesai · {score.c} dari {score.t} jawaban sesuai harapan
          </Muted>
          <ButtonLink href="/hasil">Lihat hasil hari ini</ButtonLink>
          <ButtonLink href="/" variant="alt">
            Kembali ke beranda
          </ButtonLink>
        </div>
      ) : (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/90 px-4 pt-3 pb-2 backdrop-blur">
          {node.hints && node.hints.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {node.hints.map((h) => (
                <span key={h} className="rounded-full bg-elevated px-2.5 py-1 text-xs font-bold text-moon">
                  {h}
                </span>
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
              className={inputClass}
            />
            {rec.supported && (
              <button
                type="button"
                onClick={rec.listening ? rec.stop : rec.start}
                aria-label="Bicara"
                className={`grid size-12 shrink-0 place-items-center rounded-xl bg-elevated ring-1 ring-line transition active:scale-90 ${rec.listening ? "bg-primary animate-pulse-ring" : ""}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <rect x="9" y="3" width="6" height="11" rx="3" fill="#F4F3FF" />
                  <path d="M6 11a6 6 0 0012 0M12 17v4" stroke="#F4F3FF" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </form>
          <div className="flex items-center gap-2">
            <Chip active={voiceOn} onClick={() => setVoiceOn(!voiceOn)}>
              {voiceOn ? "🔊 Suara aktif" : "🔇 Suara mati"}
            </Chip>
            <div className="ml-auto w-28">
              <Button className="py-2.5" onClick={send} disabled={!shownInput.trim() || rec.listening}>
                Kirim
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
