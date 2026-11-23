"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { UNITS } from "@/lib/content";
import {
  buildExam,
  checkListen,
  checkOrder,
  checkTyped,
  type ExamQ,
} from "@/lib/exam";
import {
  currentLevel,
  type Difficulty,
  findLevel,
  HEARTS,
  type Lang,
  langOf,
  LESSON_COUNT,
  lessonsDone,
  type Level,
  levelOfUnit,
  levelsOf,
  unitsOfCourse,
  unitsOfLevel,
  unitUnlocked,
} from "@/lib/levels";
import {
  addResult,
  firstName,
  type Progress,
  saveExam,
  todayKey,
  useProgress,
} from "@/lib/progress";
import { speak, stopSpeaking } from "@/lib/speech";
import type { Unit } from "@/lib/types";
import { HexBadge, Icon, Planet, Sparkle } from "@/components/cosmic";
import { T } from "@/components/T";
import { AudioButton, TileBoard } from "@/components/Tiles";
import {
  ComboToast,
  Confetti,
  CountUp,
  isComboMilestone,
} from "@/components/motion";
import { buzz, sfx } from "@/lib/sfx";
import {
  Actions,
  Button,
  ButtonLink,
  Chip,
  inputClass,
  Kbd,
  Loading,
  Muted,
  ProgressBar,
  Spacer,
  TopBar,
} from "@/components/ui";

export default function UjianPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExamRoute />
    </Suspense>
  );
}

interface Config {
  key: string; // kunci riwayat: "unit:en-u01" / "level:b1"
  kind: "unit" | "level";
  title: string;
  subtitle: string;
  units: Unit[];
  diff: Difficulty;
  count: number;
  levelIdx: number;
  lang: Lang;
  levels: Level[];
}

function Blocked({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <TopBar left="Ujian" back="/latihan" />
      <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-surface px-6 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-elevated text-mute">
          <Icon kind="lock" size={26} />
        </span>
        <h2 className="text-xl font-extrabold">{title}</h2>
        <Muted>{children}</Muted>
      </div>
      <ButtonLink href="/latihan" variant="alt">
        Kembali ke jalur
      </ButtonLink>
    </>
  );
}

function ExamRoute() {
  const sp = useSearchParams();
  const p = useProgress();
  if (!p) return <Loading />;

  const unitId = sp.get("unit");
  const levelId = sp.get("tingkat");
  let cfg: Config | null = null;

  if (unitId) {
    const u = UNITS.find((x) => x.id === unitId);
    if (!u)
      return <Blocked title="Unit tidak ditemukan">Cek lagi tautannya.</Blocked>;
    if (!unitUnlocked(p, u))
      return (
        <Blocked title="Unit masih terkunci">
          Lulus Ujian Unit sebelumnya dulu untuk membuka {u.title}.
        </Blocked>
      );
    const li = levelOfUnit(u);
    const lang = langOf(u);
    const levels = levelsOf(lang);
    cfg = {
      key: `unit:${u.id}`,
      kind: "unit",
      title: "Ujian Unit",
      subtitle: u.title,
      units: [u],
      diff: levels[li].difficulty,
      count: levels[li].difficulty.unitQuestions,
      levelIdx: li,
      lang,
      levels,
    };
  } else if (levelId) {
    const found = findLevel(levelId);
    if (!found)
      return (
        <Blocked title="Tingkat tidak ditemukan">Cek lagi tautannya.</Blocked>
      );
    const { lang, idx: li } = found;
    const levels = levelsOf(lang);
    const units = unitsOfLevel(li, lang);
    const cur = currentLevel(p, lang);
    if (li > cur)
      return (
        <Blocked title="Tingkat masih terkunci">
          Selesaikan tingkat {levels[cur].cefr} dulu.
        </Blocked>
      );
    if (!units.length)
      return (
        <Blocked title="Materi belum tersedia">
          Materi tingkat {levels[li].cefr} sedang disiapkan.
        </Blocked>
      );
    const next = levels[li + 1];
    cfg = {
      key: `level:${levels[li].id}`,
      kind: "level",
      title: next
        ? `Ujian Naik ke ${next.cefr}`
        : `Ujian Akhir ${levels[li].cefr}`,
      subtitle: `Semua materi tingkat ${levels[li].cefr}`,
      units,
      diff: levels[li].difficulty,
      count: levels[li].difficulty.levelQuestions,
      levelIdx: li,
      lang,
      levels,
    };
  }

  if (!cfg)
    return (
      <Blocked title="Pilih ujian dari jalur">
        Buka halaman Jalur untuk memilih ujian.
      </Blocked>
    );
  return <ExamFlow key={cfg.key} cfg={cfg} p={p} />;
}

// ---------------------------------------------------------------------------

type Phase = "intro" | "run" | "result";

interface Outcome {
  passed: boolean;
  score: number;
  answered: number;
  nextUnit?: Unit;
}

function ExamFlow({ cfg, p }: { cfg: Config; p: Progress }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [qs, setQs] = useState<ExamQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const name = firstName(p);
  const record = p.path.exams[cfg.key];
  const level = cfg.levels[cfg.levelIdx];

  function start() {
    setQs(buildExam(cfg.units, cfg.diff, cfg.count));
    setIdx(0);
    setHearts(HEARTS);
    setCombo(0);
    setCorrect(0);
    setOutcome(null);
    setPhase("run");
  }

  function finish(passed: boolean, c: number, answered: number) {
    stopSpeaking();
    const score = answered ? c / answered : 0;
    const bonus = passed ? (cfg.kind === "level" ? 30 : 15) : 0;
    // XP dicatat sebelum unit aktif berpindah, supaya pengalinya sesuai tingkat ujian ini.
    addResult(c, answered, c * 2 + bonus);

    const today = todayKey();
    let nextUnit: Unit | undefined;
    if (passed) {
      if (cfg.kind === "unit") {
        const list = unitsOfLevel(cfg.levelIdx, cfg.lang);
        nextUnit = list[list.findIndex((x) => x.id === cfg.units[0].id) + 1];
      } else {
        nextUnit = unitsOfLevel(cfg.levelIdx + 1, cfg.lang)[0];
      }
    }
    saveExam(cfg.key, score, passed, (d) => {
      if (!passed) return;
      if (cfg.kind === "unit") {
        d.path.passedUnits[cfg.units[0].id] ??= today;
      } else {
        // Lulus tingkat (termasuk lewat Uji Lompat) = semua unit di tingkat itu dan sebelumnya ikut lulus.
        for (let i = 0; i <= cfg.levelIdx; i++)
          d.path.passedLevels[cfg.levels[i].id] ??= today;
        for (const u of unitsOfCourse(cfg.lang))
          if (levelOfUnit(u) <= cfg.levelIdx)
            d.path.passedUnits[u.id] ??= today;
      }
      if (nextUnit) d.settings.unitId = nextUnit.id;
    });
    setOutcome({ passed, score, answered, nextUnit });
    setPhase("result");
  }

  if (phase === "intro") {
    const d = cfg.diff;
    const rules = [
      `${cfg.count} soal`,
      `${HEARTS} nyawa`,
      ...(d.mix.cloze > 0
        ? [d.clozeChoices ? "Isi celah: pilihan" : "Isi celah: diketik"]
        : []),
      ...(d.listenMode === "tiles"
        ? [d.mix.order > 0 ? "Dengar lalu susun" : "Dengar lalu pilih huruf"]
        : []),
      ...(d.mix.order > 0
        ? [
            d.orderDistractors
              ? `Susun kata + ${d.orderDistractors} pengecoh`
              : "Susun kata tanpa pengecoh",
          ]
        : []),
      ...(d.listenMode === "type"
        ? [`Dengar: ${Math.round(d.listenPass * 100)}% kata tepat`]
        : []),
    ];
    const done = cfg.kind === "unit" ? lessonsDone(p, cfg.units[0]) : null;
    return (
      <>
        <TopBar left={cfg.title} back="/latihan" right={level.cefr} />
        <div className="card-nebula relative flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] px-6 pt-8 pb-7 text-center">
          <Sparkle className="absolute top-6 left-10" />
          <Sparkle
            className="absolute top-12 right-12"
            size={10}
            color="#7DD3FC"
            delay={0.8}
          />
          <div className="animate-float">
            <Planet id="exam-intro" tone={level.tone} size={96} />
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide uppercase">
            {cfg.kind === "unit"
              ? "Ujian Unit"
              : cfg.levels[cfg.levelIdx + 1]
                ? "Ujian Naik Tingkat"
                : "Ujian Akhir"}
          </span>
          <h2 className="text-2xl font-extrabold">{cfg.subtitle}</h2>
          <p className="max-w-md text-sm text-ink/85">
            {cfg.kind === "unit"
              ? `${name}, lulus ujian ini untuk membuka unit berikutnya. Salah ${HEARTS} kali dan ujian berhenti, tapi kamu bisa mencoba lagi kapan saja.`
              : cfg.levels[cfg.levelIdx + 1]
                ? `${name}, lulus di sini dan kamu naik tingkat. Soalnya diambil dari semua unit ${level.cefr}, jadi ini juga bisa dipakai sebagai Uji Lompat.`
                : `${name}, ini ujian terakhir di jalur Lexinova. Soalnya diambil dari semua unit ${level.cefr} dengan tingkat kesulitan tertinggi.`}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {rules.map((r) => (
            <span
              key={r}
              className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-mute"
            >
              {r}
            </span>
          ))}
        </div>

        {done !== null && done < LESSON_COUNT && (
          <p className="rounded-2xl bg-cyan/10 px-4 py-3 text-sm text-ink/90">
            Baru {done} dari {LESSON_COUNT} pelajaran unit ini yang selesai.
            Kamu tetap boleh langsung ujian untuk melompat.
          </p>
        )}
        {record && (
          <Muted className="text-center">
            Skor terbaik {Math.round(record.best * 100)}% · {record.attempts}x
            mencoba{record.passed ? " · sudah lulus" : ""}
          </Muted>
        )}
        <Spacer />
        <Actions>
          <ButtonLink href="/latihan" variant="alt">
            Nanti saja
          </ButtonLink>
          <Button onClick={start} autoFocus>
            {record?.passed ? "Ulangi ujian" : "Mulai ujian"}
          </Button>
        </Actions>
      </>
    );
  }

  if (phase === "result" && outcome)
    return (
      <Result
        cfg={cfg}
        outcome={outcome}
        name={name}
        onRetry={() => setPhase("intro")}
      />
    );

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/latihan"
          onClick={(e) => {
            if (!confirm("Keluar dari ujian? Hasil ujian ini tidak disimpan."))
              e.preventDefault();
            else stopSpeaking();
          }}
          aria-label="Keluar dari ujian"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink transition hover:bg-elevated active:scale-90"
        >
          <Icon kind="x" size={18} strokeWidth={2.2} />
        </Link>
        <ProgressBar value={idx / qs.length} className="flex-1" />
        <div
          className="flex items-center gap-0.5"
          aria-label={`${hearts} nyawa tersisa`}
        >
          {Array.from({ length: HEARTS }, (_, i) => (
            // Hati yang baru saja hilang diberi animasi "pecah".
            <span
              key={i === hearts ? `lost-${hearts}` : i}
              className={i === hearts ? "animate-heart-break" : ""}
            >
              <Icon
                kind="heart"
                size={22}
                className={i < hearts ? "fill-bad text-bad" : "text-elevated"}
              />
            </span>
          ))}
        </div>
      </div>
      {isComboMilestone(combo) && <ComboToast key={combo} streak={combo} />}
      <Question
        key={idx}
        q={qs[idx]}
        diff={cfg.diff}
        onAnswer={(ok) => {
          if (ok) setCorrect((c) => c + 1);
          else setHearts((h) => h - 1);
          setCombo((c) => (ok ? c + 1 : 0));
        }}
        onNext={() => {
          if (hearts <= 0) return finish(false, correct, idx + 1);
          if (idx + 1 >= qs.length) return finish(true, correct, qs.length);
          setIdx(idx + 1);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------

function Result({
  cfg,
  outcome,
  name,
  onRetry,
}: {
  cfg: Config;
  outcome: Outcome;
  name: string;
  onRetry: () => void;
}) {
  const pct = Math.round(outcome.score * 100);
  const nextLevel = cfg.levels[cfg.levelIdx + 1];

  useEffect(() => {
    if (!outcome.passed) sfx("wrong");
    else sfx(cfg.kind === "level" ? "levelup" : "complete");
  }, [outcome.passed, cfg.kind]);

  if (!outcome.passed)
    return (
      <>
        <TopBar left={cfg.title} back="/latihan" />
        <div className="animate-pop flex flex-col items-center gap-3 rounded-[2rem] bg-surface px-6 py-10 text-center">
          <span className="animate-heart-break grid size-16 place-items-center rounded-full bg-bad/15 text-bad">
            <Icon kind="heart" size={30} />
          </span>
          <h2 className="text-2xl font-extrabold">Nyawa habis</h2>
          <p className="max-w-sm text-mute">
            {pct}% benar dari {outcome.answered} soal. Ulangi pelajaran yang
            terasa berat, lalu coba lagi, {name}.
          </p>
        </div>
        <Spacer />
        <Actions>
          <ButtonLink href="/latihan" variant="alt">
            Kembali ke jalur
          </ButtonLink>
          <Button onClick={onRetry}>Coba lagi</Button>
        </Actions>
      </>
    );

  const levelUp = cfg.kind === "level";
  const title = levelUp
    ? nextLevel
      ? `${name} naik ke ${nextLevel.cefr}!`
      : `${name} menuntaskan ${cfg.levels[cfg.levelIdx].cefr}!`
    : "Unit lulus!";
  const text = levelUp
    ? nextLevel
      ? `Sekarang kamu di tingkat ${nextLevel.name}, kira-kira setara ${nextLevel.badges[0].replace("≈ ", "")}. Di sini kamu berlatih: ${nextLevel.canDo.charAt(0).toLowerCase()}${nextLevel.canDo.slice(1)}`
      : `Semua tingkat sudah kamu lewati. Saatnya memakai ${cfg.lang === "ja" ? "bahasa Jepang" : "bahasa Inggris"}mu di dunia nyata.`
    : outcome.nextUnit
      ? `Skor ${pct}%. Unit berikutnya terbuka: ${outcome.nextUnit.title}.`
      : `Skor ${pct}%. Semua unit ${cfg.levels[cfg.levelIdx].cefr} sudah lulus, jadi Ujian Naik Tingkat sekarang terbuka.`;

  return (
    <>
      <Confetti count={levelUp ? 110 : 70} />
      <TopBar left={cfg.title} back="/latihan" />
      <div className="card-nebula animate-pop relative flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] px-6 py-9 text-center">
        <Sparkle className="absolute top-6 left-8" size={14} />
        <Sparkle
          className="absolute top-14 right-10"
          size={10}
          color="#7DD3FC"
          delay={0.8}
        />
        <Sparkle
          className="absolute bottom-16 left-12"
          size={9}
          color="#C5B8FF"
          delay={1.4}
        />
        <div className="text-sm font-semibold tracking-wide text-ink/80 uppercase">
          {levelUp ? (
            "Naik tingkat"
          ) : (
            <>
              Skor <CountUp to={pct} suffix="%" />
            </>
          )}
        </div>
        <div className="animate-badge-in">
          <HexBadge size={levelUp ? 150 : 120} />
        </div>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <p className="max-w-md text-ink/85">{text}</p>
        {levelUp && nextLevel && !unitsOfLevel(cfg.levelIdx + 1, cfg.lang).length && (
          <p className="max-w-md rounded-2xl bg-white/10 px-4 py-2 text-sm">
            Materi {nextLevel.cefr} sedang disiapkan. Minta Claude membuat unit
            berikutnya.
          </p>
        )}
      </div>
      <Spacer />
      <Actions>
        <ButtonLink href="/hasil" variant="alt">
          Lihat progres
        </ButtonLink>
        <ButtonLink href="/latihan">Lanjut di jalur</ButtonLink>
      </Actions>
    </>
  );
}

// ---------------------------------------------------------------------------

/** Pintasan keyboard: Enter = tombol utama (Cek/Lanjut), angka 1–4 = pilih jawaban. */
function useKeys(handler: (key: string) => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Enter pada tombol/tautan sudah memicu klik bawaan.
      if (e.key === "Enter" && (t.tagName === "BUTTON" || t.tagName === "A"))
        return;
      if (t.tagName === "INPUT" && e.key !== "Enter") return;
      ref.current(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

type Verdict = { ok: boolean; body: ReactNode };
type Answer = number | null | string | number[];

function initial(q: ExamQ): Answer {
  return q.kind === "choice" ? null : q.kind === "order" ? [] : "";
}

function isReady(a: Answer): boolean {
  if (Array.isArray(a)) return a.length > 0;
  if (typeof a === "string") return !!a.trim();
  return a !== null;
}

/** Menilai jawaban. Murni tanpa state. */
function evaluate(q: ExamQ, a: Answer, diff: Difficulty): Verdict {
  switch (q.kind) {
    case "choice": {
      const ok = a === q.answer;
      return {
        ok,
        body: (
          <>
            {!ok && (
              <div>
                Jawaban: <b><T>{q.options[q.answer]}</T></b>
              </div>
            )}
            {q.explain && (
              <div className="mt-1 text-mute">
                <T romaji={false}>{q.explain}</T>
              </div>
            )}
          </>
        ),
      };
    }
    case "type": {
      const r = checkTyped(a as string, q.answer);
      return {
        ok: r.ok,
        body: (
          <>
            {(!r.ok || r.typo) && (
              <div>
                {r.typo
                  ? "Ada salah ketik kecil. Ejaan yang benar: "
                  : "Jawaban: "}
                <b>{q.answer}</b>
              </div>
            )}
            <div className="mt-1 text-mute">{q.full}</div>
          </>
        ),
      };
    }
    case "order": {
      const ok = checkOrder(
        (a as number[]).map((i) => q.tiles[i]),
        q.target,
      );
      return {
        ok,
        body: (
          <>
            {ok ? (
              <T>{q.target}</T>
            ) : (
              <>
                Susunan yang benar: <b><T>{q.target}</T></b>
              </>
            )}
            {q.translation && (
              <div className="mt-1 text-mute">{q.translation}</div>
            )}
          </>
        ),
      };
    }
    case "listen": {
      const r = checkListen(a as string, q.text, diff.listenPass);
      return {
        ok: r.ok,
        body: (
          <>
            <div className="flex flex-wrap gap-x-1.5 gap-y-1">
              {r.tokens.map((t, i) => (
                <span
                  key={i}
                  className={t.ok ? "text-ok" : "rounded bg-bad/20 px-1 text-bad"}
                >
                  {t.word}
                </span>
              ))}
            </div>
            <div className="mt-1 text-mute">
              {r.correct}/{r.total} kata tepat (minimal{" "}
              {Math.round(diff.listenPass * 100)}%) · {q.translation}
            </div>
          </>
        ),
      };
    }
  }
}

function Question({
  q,
  diff,
  onAnswer,
  onNext,
}: {
  q: ExamQ;
  diff: Difficulty;
  onAnswer: (ok: boolean) => void;
  onNext: () => void;
}) {
  const [ans, setAns] = useState<Answer>(() => initial(q));
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const ready = isReady(ans);
  const locked = !!verdict;

  function check() {
    if (verdict || !ready) return;
    const v = evaluate(q, ans, diff);
    setVerdict(v);
    onAnswer(v.ok);
    sfx(v.ok ? "correct" : "wrong");
    if (!v.ok) buzz();
  }

  useKeys((k) => {
    if (k !== "Enter") return;
    if (verdict) onNext();
    else check();
  });

  return (
    <div className="animate-card-in flex flex-1 flex-col gap-4">
      <span className="w-fit rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-lavender uppercase">
        {q.tag}
      </span>
      <div
        className={`flex flex-col gap-4 ${verdict ? (verdict.ok ? "animate-bounce-in" : "animate-shake") : ""}`}
      >
      {q.kind === "choice" && (
        <ChoiceQ
          q={q}
          value={ans as number | null}
          onChange={setAns}
          locked={locked}
        />
      )}
      {q.kind === "type" && (
        <TypeQ q={q} value={ans as string} onChange={setAns} locked={locked} />
      )}
      {q.kind === "order" && (
        <OrderQ
          q={q}
          value={ans as number[]}
          onChange={setAns}
          locked={locked}
        />
      )}
      {q.kind === "listen" && (
        <ListenQ
          q={q}
          diff={diff}
          value={ans as string}
          onChange={setAns}
          locked={locked}
        />
      )}
      </div>
      <Spacer />
      {verdict && (
        <div
          role="status"
          className={`animate-slide-up rounded-3xl p-4 ring-1 ${verdict.ok ? "bg-ok/10 ring-ok/40" : "bg-bad/10 ring-bad/40"}`}
        >
          <div
            className={`mb-1 font-extrabold ${verdict.ok ? "text-ok" : "text-bad"}`}
          >
            {verdict.ok ? "Benar!" : "Belum tepat"}
          </div>
          <div className="text-sm text-ink/90">{verdict.body}</div>
        </div>
      )}
      {verdict ? (
        <Button onClick={onNext} autoFocus>
          Lanjut <Kbd>Enter</Kbd>
        </Button>
      ) : (
        <Button onClick={check} disabled={!ready}>
          Cek <Kbd>Enter</Kbd>
        </Button>
      )}
    </div>
  );
}

function Blanked({ sentence }: { sentence: string }) {
  const [a, b] = sentence.split("____");
  return (
    <div className="text-xl leading-loose font-bold">
      {a.trim() && <T romaji={false}>{a.trim()}</T>}
      <span className="mx-1 inline-block min-w-16 border-b-2 border-lavender align-baseline" />
      {b.trim() && <T romaji={false}>{b.trim()}</T>}
    </div>
  );
}

function ChoiceQ({
  q,
  value,
  onChange,
  locked,
}: {
  q: Extract<ExamQ, { kind: "choice" }>;
  value: number | null;
  onChange: (v: number) => void;
  locked: boolean;
}) {
  useKeys((k) => {
    const n = Number(k);
    if (!locked && n >= 1 && n <= q.options.length) onChange(n - 1);
  });
  return (
    <>
      <div className="text-xl font-bold">{q.prompt}</div>
      {q.audio && <AudioButton text={q.audio} />}
      {q.focus && (
        <div className="text-3xl leading-relaxed font-extrabold">
          {/* Romaji dimatikan di ujian supaya tidak membocorkan jawaban. */}
          <T romaji={false}>{q.focus}</T>
        </div>
      )}
      {q.sentence &&
        (q.sentence.includes("____") ? (
          <Blanked sentence={q.sentence} />
        ) : (
          <Muted className="italic">
            <T romaji={false}>{q.sentence}</T>
          </Muted>
        ))}
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const state = !locked
            ? value === i
              ? "border-lavender bg-primary/15"
              : "border-transparent hover:border-lavender/50"
            : i === q.answer
              ? "border-ok"
              : i === value
                ? "border-bad"
                : "border-transparent opacity-50";
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => onChange(i)}
              className={`flex items-center gap-3 rounded-2xl border-2 bg-surface px-4 py-3.5 text-left font-medium shadow-soft transition active:scale-[0.98] ${state}`}
            >
              <span className="hidden size-6 shrink-0 place-items-center rounded-md bg-elevated text-xs font-bold text-mute lg:grid">
                {i + 1}
              </span>
              <span className="text-lg">
                <T romaji={false}>{o}</T>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function TypeQ({
  q,
  value,
  onChange,
  locked,
}: {
  q: Extract<ExamQ, { kind: "type" }>;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}) {
  return (
    <>
      <Muted>Ketik kata yang hilang · &ldquo;{q.prompt}&rdquo;</Muted>
      <Blanked sentence={q.sentence} />
      <input
        value={value}
        disabled={locked}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jawabanmu…"
        aria-label="Kata yang hilang"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        className={inputClass}
      />
    </>
  );
}

function OrderQ({
  q,
  value,
  onChange,
  locked,
}: {
  q: Extract<ExamQ, { kind: "order" }>;
  value: number[];
  onChange: (v: number[]) => void;
  locked: boolean;
}) {
  return (
    <>
      {q.audio ? (
        <>
          <div className="text-xl font-bold">{q.prompt}</div>
          <AudioButton text={q.audio} />
        </>
      ) : (
        <>
          <div className="text-xl font-bold">Susun terjemahan kalimat ini</div>
          <div className="text-ink/90">&ldquo;{q.prompt}&rdquo;</div>
        </>
      )}
      <TileBoard tiles={q.tiles} value={value} onChange={onChange} locked={locked} />
    </>
  );
}

function ListenQ({
  q,
  diff,
  value,
  onChange,
  locked,
}: {
  q: Extract<ExamQ, { kind: "listen" }>;
  diff: Difficulty;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}) {
  const base = diff.rates.includes(1) ? 1 : diff.rates[0];
  const [rate, setRate] = useState(base);
  useEffect(() => {
    speak(q.text, { rate: base });
    return () => stopSpeaking();
  }, [q.text, base]);

  const play = (r: number) => {
    stopSpeaking();
    speak(q.text, { rate: r });
  };

  return (
    <>
      <div className="text-xl font-bold">Ketik yang kamu dengar</div>
      <button
        type="button"
        onClick={() => play(rate)}
        aria-label="Putar audio"
        className="mx-auto my-2 grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-[#8b7fff] shadow-glow transition hover:brightness-110 active:scale-90"
      >
        <Icon kind="volume" size={34} />
      </button>
      {diff.rates.length > 1 && (
        <div className="flex justify-center gap-2">
          {diff.rates.map((r) => (
            <Chip
              key={r}
              active={rate === r}
              onClick={() => {
                setRate(r);
                play(r);
              }}
            >
              {r}x
            </Chip>
          ))}
        </div>
      )}
      <input
        value={value}
        disabled={locked}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ketik kalimatnya…"
        aria-label="Kalimat yang kamu dengar"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        className={inputClass}
      />
    </>
  );
}
