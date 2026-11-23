"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  exportJson,
  importJson,
  requestPersistentStorage,
  resetProgress,
  storagePersisted,
  streak,
  todayKey,
  update,
  useProgress,
} from "@/lib/progress";
import {
  currentLevel,
  GOALS,
  INTERESTS,
  LEVELS,
} from "@/lib/levels";
import { vocabCount } from "@/lib/stats";
import { Astronaut, Icon, type IconKind } from "@/components/cosmic";
import { Loading, Toggle } from "@/components/ui";

function Row({
  icon,
  title,
  sub,
  children,
  onClick,
  danger,
}: {
  icon: IconKind;
  title: string;
  sub?: string;
  children?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-2xl ${danger ? "bg-bad/15 text-bad" : "bg-primary/20 text-lavender"}`}
      >
        <Icon kind={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold ${danger ? "text-bad" : ""}`}>
          {title}
        </span>
        {sub && <span className="block text-sm text-mute">{sub}</span>}
      </span>
      {children ??
        (onClick && <Icon kind="chevron" size={18} className="text-mute" />)}
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-elevated/50"
    >
      {inner}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-full bg-elevated p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition ${value === o ? "bg-primary text-ink" : "text-mute hover:text-ink"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ChipGroup({
  title,
  sub,
  options,
  value,
  onChange,
}: {
  title: string;
  sub: string;
  options: Record<string, string>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <div className="font-semibold">{title}</div>
      <div className="mb-2 text-sm text-mute">{sub}</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([k, label]) => {
          const on = value.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((x) => x !== k) : [...value, k])
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                on
                  ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40"
                  : "bg-elevated text-mute hover:text-ink"
              }`}
            >
              {on && <Icon kind="check" size={14} strokeWidth={2.6} />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Pengaturan() {
  const p = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => {
    storagePersisted().then(setPersisted);
  }, []);
  if (!p) return <Loading />;

  function download() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lexinova-progres-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Progres diekspor ke file.");
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    try {
      importJson(await f.text());
      setMsg("Progres berhasil diimpor.");
    } catch (e) {
      setMsg(`Gagal impor: ${(e as Error).message}`);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">Pengaturan</h1>

      {/* Profil */}
      <section className="card-nebula flex items-center gap-4 rounded-[2rem] p-5">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15">
          <div className="translate-y-2">
            <Astronaut size={64} id="profile" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={p.settings.name}
            onChange={(e) =>
              update(
                (d) => void (d.settings.name = e.target.value.slice(0, 30)),
              )
            }
            placeholder="Nama panggilan"
            aria-label="Nama panggilan"
            className="w-full rounded-xl bg-transparent px-1 py-0.5 text-xl font-extrabold outline-none placeholder:text-ink/60 focus:bg-white/10"
          />
          <div className="px-1 text-sm text-ink/80">
            Inggris {LEVELS[currentLevel(p)].cefr} · {vocabCount(p)} kata ·{" "}
            {streak(p)} hari streak
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-mute">Belajar</h2>
        <div className="divide-y divide-line overflow-hidden rounded-3xl bg-surface shadow-soft">
          <Row icon="star" title="Target harian" sub="XP per hari">
            <Segmented
              value={p.settings.dailyGoal}
              options={[30, 50, 80, 120]}
              onChange={(v) => update((d) => void (d.settings.dailyGoal = v))}
            />
          </Row>
          <Row icon="words" title="Kata baru per hari">
            <Segmented
              value={p.settings.newPerDay}
              options={[3, 6, 10, 15]}
              onChange={(v) => update((d) => void (d.settings.newPerDay = v))}
            />
          </Row>
          <Row
            icon="volume"
            title="Bacakan dialog otomatis"
            sub="Di latihan conversation"
          >
            <Toggle
              label="Bacakan dialog otomatis"
              checked={p.settings.autoVoice}
              onChange={(v) => update((d) => void (d.settings.autoVoice = v))}
            />
          </Row>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-mute">
          Profil belajar
        </h2>
        <div className="flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-soft">
          <ChipGroup
            title="Tujuan"
            sub="Menentukan tema unit yang disorot di jalur"
            options={GOALS}
            value={p.settings.goals}
            onChange={(v) => update((d) => void (d.settings.goals = v))}
          />
          <ChipGroup
            title="Minat"
            sub="Bidang yang ingin sering muncul di materi"
            options={INTERESTS}
            value={p.settings.interests}
            onChange={(v) => update((d) => void (d.settings.interests = v))}
          />
          <div>
            <div className="font-semibold">Target tingkat</div>
            <div className="mb-2 text-sm text-mute">
              Ditampilkan di Jalur sebagai tujuanmu, beserta perkiraan IELTS
            </div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={p.settings.targetLevel === l.id}
                  onClick={() =>
                    update((d) => void (d.settings.targetLevel = l.id))
                  }
                  className={`rounded-2xl px-3 py-2 text-left text-sm transition ${
                    p.settings.targetLevel === l.id
                      ? "bg-primary text-ink"
                      : "bg-elevated text-mute hover:text-ink"
                  }`}
                >
                  <div className="font-bold">{l.cefr}</div>
                  <div className="text-[11px] opacity-80">IELTS {l.ielts}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-mute">Data</h2>
        <div className="divide-y divide-line overflow-hidden rounded-3xl bg-surface shadow-soft">
          <Row
            icon="lock"
            title="Penyimpanan permanen"
            sub={
              persisted === true
                ? "Aktif. Browser tidak akan menghapus progresmu secara otomatis."
                : persisted === false
                  ? "Belum diizinkan browser. Progres tetap tersimpan, tapi bisa terhapus bila disk penuh."
                  : "Memeriksa…"
            }
          >
            {persisted === true ? (
              <span className="rounded-full bg-ok/15 px-2.5 py-1 text-xs font-bold text-ok">
                Aktif
              </span>
            ) : persisted === false ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestPersistentStorage();
                  setPersisted(ok);
                  setMsg(
                    ok
                      ? "Penyimpanan permanen aktif."
                      : "Browser belum mengizinkan. Pasang Lexinova ke layar utama/desktop lalu coba lagi.",
                  );
                }}
                className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold transition hover:bg-[#7b73ff]"
              >
                Minta izin
              </button>
            ) : null}
          </Row>
          <Row
            icon="upload"
            title="Ekspor progres"
            sub="Simpan cadangan ke file JSON"
            onClick={download}
          />
          <Row
            icon="book"
            title="Impor progres"
            sub="Pulihkan dari file JSON"
            onClick={() => fileRef.current?.click()}
          />
          <Row
            icon="x"
            title="Hapus semua progres"
            sub="Kartu, streak, dan riwayat di browser ini"
            danger
            onClick={() => {
              if (
                confirm(
                  "Hapus semua progres? Ini tidak bisa dibatalkan kecuali kamu punya file ekspor.",
                )
              ) {
                resetProgress();
                setMsg("Progres dihapus.");
              }
            }}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {msg && <p className="mt-3 px-1 text-sm text-cyan">{msg}</p>}
      </section>

      <p className="px-1 text-xs text-mute">
        Progres tersimpan otomatis di browser ini setiap kali kamu menjawab,
        jadi tetap ada walau tab atau browser ditutup. Data tidak ikut pindah
        ke browser atau perangkat lain, dan hilang bila riwayat situs dihapus.
        Ekspor sesekali sebagai cadangan.
      </p>
    </div>
  );
}
