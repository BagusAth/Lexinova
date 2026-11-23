"use client";

import { useMemo, useState } from "react";
import { getUnit } from "@/lib/content";
import { checkOrder } from "@/lib/exam";
import { normalize } from "@/lib/text";
import { tileTokens } from "@/lib/ja";
import { seeded, shuffled } from "@/lib/random";
import { type Difficulty, difficultyOf } from "@/lib/levels";
import { buzz, sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { T } from "@/components/T";
import { TileBoard } from "@/components/Tiles";
import { checkText, type LtMatch } from "@/lib/languagetool";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { countWords } from "@/lib/text";
import type { BuildWriting, EssayWriting } from "@/lib/types";
import { SkillDone } from "@/components/SkillDone";
import {
  Button,
  Card,
  Chip,
  inputClass,
  Loading,
  Muted,
  ProgressBar,
  Spacer,
  TopBar,
} from "@/components/ui";

export default function WritingPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  const ex = unit.writing[0];
  if (!ex) return <Muted>Belum ada materi writing.</Muted>;
  if (ex.mode === "build")
    return <BuildExercise key={ex.id} ex={ex} diff={difficultyOf(unit)} />;
  return <WritingExercise key={ex.id} ex={ex} />;
}

// ---------------------------------------------------------------------------
// Susun kalimat (bahasa Jepang): terjemahkan kalimat Indonesia dengan ubin.

function BuildExercise({ ex, diff }: { ex: BuildWriting; diff: Difficulty }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const sentence = ex.sentences[idx];
  const tiles = useMemo(() => {
    if (!sentence) return [];
    const own = tileTokens(sentence.ja);
    const ownKeys = new Set(own.map((t) => normalize(t)));
    const rng = seeded(ex.id + idx);
    const extra = shuffled(
      [
        ...new Set(
          ex.sentences
            .flatMap((x) => tileTokens(x.ja))
            .filter((t) => !ownKeys.has(normalize(t))),
        ),
      ],
      rng,
    ).slice(0, diff.orderDistractors);
    return shuffled([...own, ...extra], rng);
  }, [ex, idx, sentence, diff.orderDistractors]);

  if (idx >= ex.sentences.length)
    return (
      <SkillDone
        skill="writing"
        title="Susun kalimat"
        detail={`${score} dari ${ex.sentences.length} kalimat tepat`}
      />
    );

  function check() {
    const ok = checkOrder(
      picked.map((i) => tiles[i]),
      sentence.ja,
    );
    setVerdict(ok);
    sfx(ok ? "correct" : "wrong");
    if (!ok) buzz();
    speak(sentence.ja);
  }

  function next() {
    const s = score + (verdict ? 1 : 0);
    setScore(s);
    if (idx + 1 >= ex.sentences.length) {
      addResult(s, ex.sentences.length, s * 3 + 4);
      markDone(ex.id, s / ex.sentences.length);
    }
    setIdx(idx + 1);
    setPicked([]);
    setVerdict(null);
  }

  return (
    <>
      <TopBar left="Susun kalimat" right={`${idx + 1} / ${ex.sentences.length}`} />
      <ProgressBar value={idx / ex.sentences.length} />
      <div key={idx} className="animate-card-in flex flex-1 flex-col gap-4">
        <Muted>{ex.prompt}</Muted>
        <div className="text-2xl font-extrabold">&ldquo;{sentence.id}&rdquo;</div>
        <TileBoard
          tiles={tiles}
          value={picked}
          onChange={setPicked}
          locked={verdict !== null}
        />
        <Spacer />
        {verdict !== null && (
          <div
            role="status"
            className={`animate-slide-up rounded-3xl p-4 ring-1 ${verdict ? "bg-ok/10 ring-ok/40" : "bg-bad/10 ring-bad/40"}`}
          >
            <div className={`mb-1 font-extrabold ${verdict ? "text-ok" : "text-bad"}`}>
              {verdict ? "Benar!" : "Belum tepat"}
            </div>
            <div className="text-lg">
              <T>{sentence.ja}</T>
            </div>
          </div>
        )}
        {verdict === null ? (
          <Button onClick={check} disabled={!picked.length}>
            Cek
          </Button>
        ) : (
          <Button onClick={next} autoFocus>
            Lanjut
          </Button>
        )}
      </div>
    </>
  );
}

const DRAFT_KEY = (id: string) => `lexinova:draft:${id}`;

function loadDraft(id: string): string {
  try {
    return localStorage.getItem(DRAFT_KEY(id)) ?? "";
  } catch {
    return "";
  }
}

function WritingExercise({ ex }: { ex: EssayWriting }) {
  const [text, setText] = useState(() =>
    typeof window === "undefined" ? "" : loadDraft(ex.id),
  );
  const [checking, setChecking] = useState(false);
  const [matches, setMatches] = useState<LtMatch[] | null>(null);
  const [ltError, setLtError] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean[]>(() =>
    ex.checklist.map(() => false),
  );
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
      setLtError(
        "Gagal menghubungi LanguageTool. Cek koneksi internet, lalu coba lagi.",
      );
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

  if (done)
    return (
      <SkillDone
        skill="writing"
        title="Writing"
        detail={`${n} kata · ${checked.filter(Boolean).length}/${ex.checklist.length} poin daftar cek`}
      />
    );

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
        <summary className="cursor-pointer text-sm text-lavender">
          Frasa yang berguna
        </summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ex.useful_phrases.map((ph) => (
            <span key={ph} className="rounded-md border border-line px-2 py-1">
              {ph}
            </span>
          ))}
        </div>
      </details>

      <textarea
        rows={8}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Hi Sarah, …"
        spellCheck={false}
        className={inputClass}
      />

      <Button variant="alt" onClick={check} disabled={checking || n < 5}>
        {checking ? "Mengecek…" : "Cek tata bahasa (LanguageTool)"}
      </Button>
      {ltError && <Muted className="text-bad">{ltError}</Muted>}
      {matches && (
        <Card className="text-sm">
          {matches.length === 0 ? (
            <span className="font-semibold text-ok">
              Tidak ada kesalahan yang terdeteksi.
            </span>
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.map((m, i) => (
                <li key={i}>
                  <span className="rounded bg-bad/20 px-1 text-bad line-through decoration-bad/60">
                    {text.slice(m.offset, m.offset + m.length)}
                  </span>
                  {m.replacements.length > 0 && (
                    <>
                      {" → "}
                      <span className="font-semibold text-ok">
                        {m.replacements.join(" / ")}
                      </span>
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
            <label
              key={i}
              className="flex cursor-pointer items-start gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() =>
                  setChecked(checked.map((v, j) => (j === i ? !v : v)))
                }
                className="mt-0.5 size-4 shrink-0 accent-[#6C63FF]"
              />
              <span className={checked[i] ? "text-mute line-through" : ""}>
                {c}
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Chip className="self-start" onClick={() => setShowModel(!showModel)}>
        {showModel ? "Sembunyikan contoh jawaban" : "Lihat contoh jawaban"}
      </Chip>
      {showModel && (
        <Card className="text-sm whitespace-pre-line">{ex.model_answer}</Card>
      )}

      <Spacer />
      <Button onClick={finish} disabled={n < ex.min_words}>
        Selesai
      </Button>
    </>
  );
}
