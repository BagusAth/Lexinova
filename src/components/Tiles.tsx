"use client";

// Komponen bersama ala Duolingo:
// - TileBoard: menyusun kalimat dari ubin kata (tanpa perlu keyboard Jepang).
// - AudioButton: tombol putar besar dengan pilihan kecepatan.

import { useEffect, useState } from "react";
import { speak, stopSpeaking } from "@/lib/speech";
import { Icon } from "./cosmic";
import { T } from "./T";
import { Chip } from "./ui";

const tileClass =
  "rounded-xl border-b-4 border-[#1a1b33] bg-elevated px-3 py-2 font-semibold shadow-soft transition active:translate-y-0.5 active:border-b-2";

export function TileBoard({
  tiles,
  value,
  onChange,
  locked,
}: {
  tiles: string[];
  value: number[];
  onChange: (v: number[]) => void;
  locked: boolean;
}) {
  return (
    <>
      <div
        className="flex min-h-24 flex-wrap content-start gap-2 border-y border-line py-3"
        aria-label="Kalimat yang kamu susun"
      >
        {value.map((i, pos) => (
          <button
            key={`${i}-${pos}`}
            type="button"
            disabled={locked}
            onClick={() => onChange(value.filter((_, k) => k !== pos))}
            className={`${tileClass} animate-rise`}
          >
            <T>{tiles[i]}</T>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((w, i) => {
          const used = value.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={locked || used}
              onClick={() => onChange([...value, i])}
              className={`${tileClass} ${used ? "opacity-40 shadow-none [&_*]:invisible" : "hover:bg-[#33345a]"}`}
            >
              <T>{w}</T>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function AudioButton({
  text,
  rates = [1],
  auto = true,
  size = "lg",
}: {
  text: string;
  rates?: number[];
  auto?: boolean;
  size?: "lg" | "md";
}) {
  const base = rates.includes(1) ? 1 : rates[0];
  const [rate, setRate] = useState(base);
  useEffect(() => {
    if (auto) speak(text, { rate: base });
    return () => stopSpeaking();
  }, [text, base, auto]);

  const play = (r: number) => {
    stopSpeaking();
    speak(text, { rate: r });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => play(rate)}
        aria-label="Putar audio"
        className={`grid place-items-center rounded-full bg-gradient-to-br from-primary to-[#8b7fff] shadow-[0_4px_0_#3d358f] transition hover:brightness-110 active:translate-y-1 active:shadow-none ${size === "lg" ? "size-20" : "size-14"}`}
      >
        <Icon kind="volume" size={size === "lg" ? 34 : 26} />
      </button>
      {rates.length > 1 && (
        <div className="flex justify-center gap-2">
          {rates.map((r) => (
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
    </div>
  );
}
