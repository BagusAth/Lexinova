"use client";

import { useState } from "react";
import { getUnit } from "@/lib/content";
import { checkText, type LtMatch } from "@/lib/languagetool";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { countWords } from "@/lib/text";
import type { Writing } from "@/lib/types";
import { SkillDone } from "@/components/SkillDone";
import { Button, Card, Chip, inputClass, Loading, Muted, Spacer, TopBar } from "@/components/ui";

export default function WritingPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const ex = getUnit(p.settings.unitId).writing[0];
  if (!ex) return <Muted>Belum ada materi writing.</Muted>;
  return <WritingExercise ex={ex} />;
}

const DRAFT_KEY = (id: string) => `lexinova:draft:${id}`;

function loadDraft(id: string): string {
  try {
    return localStorage.getItem(DRAFT_KEY(id)) ?? "";
  } catch {
    return "";
  }
}

function WritingExercise({ ex }: { ex: Writing }) {
  const [text, setText] = useState(() => (typeof window === "undefined" ? "" : loadDraft(ex.id)));
  const [checking, setChecking] = useState(false);
  const [matches, setMatches] = useState<LtMatch[] | null>(null);
  const [ltError, setLtError] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean[]>(() => ex.checklist.map(() => false));
  const [showModel, setShowModel] = useState(false);
  const [done, setDone] = useState(false);

  const n = countWords(text);
  const inRange = n >= ex.min_words && n <= ex.max_words;

  function onChange(v: string) {
    setText(v);
    setMatches(null);
    try {
      localStorage.setItem(DRAFT_KEY(ex.id), v);
    } catch {}
  }

  async function check() {
    setChecking(true);
    setLtError(null);
    try {
      setMatches(await checkText(text));
    } catch {
      setLtError("Gagal menghubungi LanguageTool. Cek koneksi internet, lalu coba lagi.");
    } finally {
      setChecking(false);
    }
  }

  function finish() {
    const ok = checked.filter(Boolean).length;
    addResult(ok, ex.checklist.length, 10 + ok * 2);
    markDone(ex.id, ok / ex.checklist.length);
    try {
      localStorage.removeItem(DRAFT_KEY(ex.id));
    } catch {}
    setDone(true);
  }

  if (done) return <SkillDone skill="writing" title="Writing" detail={`${n} kata · ${checked.filter(Boolean).length}/${ex.checklist.length} poin daftar cek`} />;

  return (
    <>
      <TopBar
        left="Writing"
        right={
          <span className={inRange ? "text-ok" : ""}>
            {n} kata ({ex.min_words}–{ex.max_words})
          </span>
        }
      />
      <p className="border-l-2 border-lavender pl-3">{ex.prompt}</p>

      <details className="text-sm">
        <summary className="cursor-pointer text-sm text-lavender">Frasa yang berguna</summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ex.useful_phrases.map((ph) => (
            <span key={ph} className="rounded-md border border-line px-2 py-1">
              {ph}
            </span>
          ))}
        </div>
      </details>

      <textarea rows={8} value={text} onChange={(e) => onChange(e.target.value)} placeholder="Hi Sarah, …" spellCheck={false} className={inputClass} />

      <Button variant="alt" onClick={check} disabled={checking || n < 5}>
        {checking ? "Mengecek…" : "Cek tata bahasa (LanguageTool)"}
      </Button>
      {ltError && <Muted className="text-bad">{ltError}</Muted>}
      {matches && (
        <Card className="text-sm">
          {matches.length === 0 ? (
            <span className="font-semibold text-ok">Tidak ada kesalahan yang terdeteksi.</span>
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.map((m, i) => (
                <li key={i}>
                  <span className="rounded bg-bad/20 px-1 text-bad line-through decoration-bad/60">{text.slice(m.offset, m.offset + m.length)}</span>
                  {m.replacements.length > 0 && (
                    <>
                      {" → "}
                      <span className="font-semibold text-ok">{m.replacements.join(" / ")}</span>
                    </>
                  )}
                  <Muted>{m.message}</Muted>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <Muted className="mb-2 font-semibold">Daftar cek (nilai sendiri)</Muted>
        <div className="flex flex-col gap-2">
          {ex.checklist.map((c, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => setChecked(checked.map((v, j) => (j === i ? !v : v)))}
                className="mt-0.5 size-4 shrink-0 accent-[#6C63FF]"
              />
              <span className={checked[i] ? "text-mute line-through" : ""}>{c}</span>
            </label>
          ))}
        </div>
      </Card>

      <Chip className="self-start" onClick={() => setShowModel(!showModel)}>
        {showModel ? "Sembunyikan contoh jawaban" : "Lihat contoh jawaban"}
      </Chip>
      {showModel && <Card className="text-sm whitespace-pre-line">{ex.model_answer}</Card>}

      <Spacer />
      <Button onClick={finish} disabled={n < ex.min_words}>
        Selesai
      </Button>
    </>
  );
}
