"use client";

import { useRef, useState } from "react";
import { exportJson, importJson, resetProgress, todayKey, update, useProgress } from "@/lib/progress";
import { Button, Card, Loading, Muted, TopBar } from "@/components/ui";

export default function Pengaturan() {
  const p = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!p) return <Loading />;

  function download() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lexinova-progres-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Progres diekspor.");
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
    <>
      <TopBar left="Pengaturan" back={null} />

      <Card className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3">
          <span className="font-semibold">Target harian (XP)</span>
          <select
            value={p.settings.dailyGoal}
            onChange={(e) => update((d) => void (d.settings.dailyGoal = Number(e.target.value)))}
            className="rounded-lg border border-line bg-elevated px-2 py-1.5"
          >
            {[30, 50, 80, 120].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="font-semibold">Kata baru per hari</span>
          <select
            value={p.settings.newPerDay}
            onChange={(e) => update((d) => void (d.settings.newPerDay = Number(e.target.value)))}
            className="rounded-lg border border-line bg-elevated px-2 py-1.5"
          >
            {[3, 6, 10, 15].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="font-semibold">Cadangan progres</div>
        <Muted>Progres hanya tersimpan di browser ini. Ekspor secara berkala, dan impor di perangkat lain untuk memindahkannya.</Muted>
        <Button variant="alt" onClick={download}>
          Ekspor ke file JSON
        </Button>
        <Button variant="alt" onClick={() => fileRef.current?.click()}>
          Impor dari file JSON
        </Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {msg && <Muted className="text-cyan">{msg}</Muted>}
      </Card>

      <Card className="flex flex-col gap-2 border-bad/40">
        <div className="font-semibold">Mulai dari nol</div>
        <Muted>Menghapus semua kartu, streak, dan riwayat di browser ini.</Muted>
        <button
          type="button"
          className="rounded-lg py-2.5 font-medium text-bad md:w-auto md:self-end md:px-5 ring-1 ring-bad/50 transition hover:bg-bad/10"
          onClick={() => {
            if (confirm("Hapus semua progres? Ini tidak bisa dibatalkan kecuali kamu punya file ekspor.")) {
              resetProgress();
              setMsg("Progres dihapus.");
            }
          }}
        >
          Hapus semua progres
        </button>
      </Card>
    </>
  );
}
