"use client";

// Suara browser: SpeechSynthesis untuk membacakan, SpeechRecognition untuk mendengar.
// Pengenalan suara paling andal di Chrome dan Edge.

import { useCallback, useEffect, useRef, useState } from "react";

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
}

export function speak(text: string, opts: { lang?: string; rate?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang ?? "en-US";
    u.rate = opts.rate ?? 1;
    const v = pickVoice(u.lang);
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// Tipe minimal karena SpeechRecognition belum ada di lib.dom TypeScript.
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => RecognitionLike) | null;
}

export function useRecognition(lang = "en-US") {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dukungan hanya bisa dicek di browser
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscript(t);
    };
    r.onerror = (e) => setError(e.error === "not-allowed" ? "Izin mikrofon ditolak." : `Gagal mendengar (${e.error}).`);
    r.onend = () => setListening(false);
    rec.current = r;
    setTranscript("");
    setError(null);
    setListening(true);
    r.start();
  }, [lang]);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { supported, listening, transcript, error, start, stop, setTranscript };
}
