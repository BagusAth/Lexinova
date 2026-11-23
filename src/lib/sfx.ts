"use client";

// Efek suara ringan ala Duolingo, dibuat langsung dengan Web Audio API
// (tanpa file audio, jadi tetap jalan offline dan tidak menambah ukuran app).
// Bisa dimatikan di Pengaturan → "Efek suara".

import { getProgress } from "./progress";

export type Sfx = "correct" | "wrong" | "complete" | "levelup" | "tap";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "triangle",
  volume = 0.13,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  // Serangan cepat lalu meluruh, supaya terdengar seperti "ting", bukan "beep".
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function soundOn(): boolean {
  try {
    return getProgress().settings.sound !== false;
  } catch {
    return false;
  }
}

export function sfx(kind: Sfx) {
  if (!soundOn()) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.01;
  switch (kind) {
    case "correct":
      note(c, 659.25, t, 0.16); // E5
      note(c, 987.77, t + 0.09, 0.28); // B5
      break;
    case "wrong":
      note(c, 233.08, t, 0.16, "square", 0.05);
      note(c, 196, t + 0.12, 0.26, "square", 0.05);
      break;
    case "tap":
      note(c, 880, t, 0.06, "sine", 0.05);
      break;
    case "complete":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        note(c, f, t + i * 0.1, 0.35),
      );
      break;
    case "levelup":
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        note(c, f, t + i * 0.11, 0.4),
      );
      [523.25, 783.99, 1046.5].forEach((f) =>
        note(c, f, t + 0.62, 0.9, "sine", 0.08),
      );
      break;
  }
}

/** Getar singkat di HP (bila didukung) untuk jawaban salah. */
export function buzz() {
  if (!soundOn()) return;
  try {
    navigator.vibrate?.(60);
  } catch {}
}
