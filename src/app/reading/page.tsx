"use client";

import { Fragment, useMemo, useState } from "react";
import { findItem, getUnit } from "@/lib/content";
import { addResult, markDone, useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { addToReview } from "@/lib/srs";
import type { Reading } from "@/lib/types";
import {
  isJaMarkup,
  needsSpace,
  normalizeJa,
  plain,
  splitTokens,
} from "@/lib/ja";
import { JaToken, T } from "@/components/T";
import { Quiz } from "@/components/Quiz";
import { SkillDone } from "@/components/SkillDone";
import {
  Button,
  Card,
  Chip,
  Loading,
  Muted,
  Spacer,
  TopBar,
} from "@/components/ui";

export default function ReadingPage() {
  const p = useProgress();
  if (!p) return <Loading />;
  const unit = getUnit(p.settings.unitId);
  const ex = unit.reading[0];
  if (!ex) return <Muted>Belum ada materi reading.</Muted>;
  return (
    <ReadingExercise
      key={ex.id}
      ex={ex}
      level={unit.level}
      inReview={(id) => !!p.cards[id]}
    />
  );
}

type Gloss = Reading["glossary"][number];

/**
 * Teks Jepang: pecah per token (markup dipisah spasi). Token yang cocok dengan
 * glosarium bisa diketuk. Pencocokan memakai teks tanpa furigana/tanda kutip.
 */
function segmentJa(text: string, glossary: Gloss[]): { tok: string; g?: Gloss }[] {
  return splitTokens(text).map((tok) => ({
    tok,
    g: glossary.find((x) => normalizeJa(x.term) === normalizeJa(tok)),
  }));
}

/** Pecah teks jadi potongan biasa dan potongan glosarium (yang bisa diklik). */
function segment(text: string, glossary: Gloss[]): (string | Gloss)[] {
  const terms = [...glossary].sort((a, b) => b.term.length - a.term.length);
  const escaped = terms.map((g) =>
    g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  if (!escaped.length) return [text];
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const out: (string | Gloss)[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const g = terms.find((t) => t.term.toLowerCase() === m[0].toLowerCase());
    if (!g) continue;
    out.push(text.slice(last, m.index));
    out.push({ ...g, term: m[0] });
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

function ReadingExercise({
  ex,
  level,
  inReview,
}: {
  ex: Reading;
  level: string;
  inReview: (itemId: string) => boolean;
}) {
  const [phase, setPhase] = useState<"read" | "quiz" | "done">("read");
  const [open, setOpen] = useState<Gloss | null>(null);
  const [added, setAdded] = useState(0);
  const [score, setScore] = useState("");
  const ja = isJaMarkup(ex.text);
  const parts = useMemo(() => segment(ex.text, ex.glossary), [ex]);
  const jaParts = useMemo(
    () => (ja ? segmentJa(ex.text, ex.glossary) : []),
    [ex, ja],
  );
  // Bahasa Jepang: ±300 karakter per menit untuk pemula.
  const minutes = ja
    ? Math.max(1, Math.round(plain(ex.text).length / 300))
    : Math.max(1, Math.round(ex.text.split(/\s+/).length / 120));

  if (phase === "done")
    return (
      <SkillDone
        skill="reading"
        title="Reading"
        detail={`${ex.title} · ${score}`}
      />
    );

  if (phase === "quiz")
    return (
      <>
        <TopBar left="Reading" right="Soal" />
        <Quiz
          questions={ex.questions}
          onDone={(c, t) => {
            addResult(c, t, c * 3);
            markDone(ex.id, c / t);
            setScore(`${c} dari ${t} benar`);
            setPhase("done");
          }}
        />
      </>
    );

  const openItem = open?.item_id ? findItem(open.item_id) : undefined;

  return (
    <>
      <TopBar left={`Reading · ${level}`} right={`${minutes} menit`} />
      <div className="text-2xl font-extrabold">{ex.title}</div>
      <Muted>
        Ketuk kata bergaris untuk melihat artinya.
        {ja && " Furigana di atas kanji menunjukkan cara bacanya."}
      </Muted>
      <Card>
        {ja ? (
          <p lang="ja" className="ja text-xl leading-[2.6]">
            {jaParts.map(({ tok, g }, i) => {
              const gap =
                i > 0 &&
                needsSpace(plain(jaParts[i - 1].tok), plain(tok))
                  ? " "
                  : "";
              return g ? (
                <Fragment key={i}>
                  {gap}
                  <button
                    type="button"
                    onClick={() => setOpen(g)}
                    className={`underline decoration-dotted decoration-2 underline-offset-[6px] transition ${
                      open?.term === g.term
                        ? "rounded-sm bg-primary/30 decoration-cyan"
                        : "decoration-lavender/70 hover:text-lavender"
                    }`}
                  >
                    <JaToken tok={tok} />
                  </button>
                </Fragment>
              ) : (
                <Fragment key={i}>
                  {gap}
                  <JaToken tok={tok} />
                </Fragment>
              );
            })}
          </p>
        ) : (
        <p className="text-[17px] leading-8">
          {parts.map((part, i) =>
            typeof part === "string" ? (
              <Fragment key={i}>{part}</Fragment>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(part)}
                className={`font-medium underline decoration-dotted decoration-2 underline-offset-4 transition ${
                  open?.term === part.term
                    ? "rounded-sm bg-primary/30 decoration-cyan"
                    : "decoration-lavender/70 hover:text-lavender"
                }`}
              >
                {part.term}
              </button>
            ),
          )}
        </p>
        )}
      </Card>

      {open && (
        <Card key={open.term} className="border-lavender/40">
          <div>
            <span className="text-lg font-semibold text-lavender">
              <T>{open.term}</T>
            </span>{" "}
            · {open.meaning}
          </div>
          {openItem && (
            <Muted className="mt-1">
              <T>{openItem.example}</T>
            </Muted>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {open.item_id &&
              (inReview(open.item_id) ? (
                <Chip disabled>Sudah di review</Chip>
              ) : (
                <Chip
                  active
                  onClick={() => {
                    addToReview(open.item_id!);
                    setAdded(added + 1);
                  }}
                >
                  + Tambah ke review
                </Chip>
              ))}
            <Chip onClick={() => speak(openItem?.example ?? open.term)}>
              Dengar
            </Chip>
            <Chip onClick={() => setOpen(null)}>Tutup</Chip>
          </div>
        </Card>
      )}

      {added > 0 && <Muted>Kata yang ditambah: {added}</Muted>}
      <Spacer />
      <Button onClick={() => setPhase("quiz")}>
        Jawab {ex.questions.length} soal
      </Button>
    </>
  );
}
