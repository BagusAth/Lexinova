"use client";

// <T> menampilkan teks materi. Teks Inggris/Indonesia tampil apa adanya.
// Teks Jepang (markup {漢字|かな}) tampil tanpa spasi, dengan furigana di atas
// kanji dan, bila diaktifkan, romaji di bawahnya.

import { createContext, useContext, type ReactNode } from "react";
import {
  hasJapanese,
  isJaMarkup,
  needsSpace,
  parseToken,
  romaji,
  splitTokens,
} from "@/lib/ja";

export interface TextSettings {
  /** Tampilkan baris romaji di bawah teks Jepang. */
  romaji: boolean;
  /** Furigana selalu tampil, atau baru muncul saat kanji diketuk/disorot. */
  furigana: "always" | "tap";
}

export const TextSettingsContext = createContext<TextSettings>({
  romaji: false,
  furigana: "always",
});

export function TextSettingsProvider({
  value,
  children,
}: {
  value: TextSettings;
  children: ReactNode;
}) {
  return (
    <TextSettingsContext.Provider value={value}>
      {children}
    </TextSettingsContext.Provider>
  );
}

export function useTextSettings(): TextSettings {
  return useContext(TextSettingsContext);
}

const plainOf =(tok: string) => tok.replace(/\{([^|{}]+)\|[^{}]+\}/g, "$1");

/** Satu token Jepang (dengan ruby untuk kanji). */
export function JaToken({ tok }: { tok: string }) {
  return (
    <>
      {parseToken(tok).map((s, i) =>
        s.ruby ? (
          <ruby key={i} tabIndex={-1}>
            {s.base}
            <rt>{s.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{s.base}</span>
        ),
      )}
    </>
  );
}

export function T({
  children: text,
  romaji: showRomajiProp,
  className = "",
}: {
  children: string;
  /** Paksa tampil/sembunyikan romaji (bawaan: ikut pengaturan). */
  romaji?: boolean;
  className?: string;
}) {
  const ctx = useContext(TextSettingsContext);
  if (!isJaMarkup(text)) return <>{text}</>;

  const tokens = splitTokens(text);
  const showRomaji =
    (showRomajiProp ?? ctx.romaji) &&
    // Romaji hanya untuk teks yang sebagian besar Jepang.
    tokens.filter((t) => hasJapanese(t)).length >= tokens.length / 2;

  const body = tokens.map((tok, i) => (
    <span key={i}>
      {i > 0 && needsSpace(plainOf(tokens[i - 1]), plainOf(tok)) ? " " : ""}
      <JaToken tok={tok} />
    </span>
  ));

  return (
    <span
      lang="ja"
      className={`ja ${ctx.furigana === "tap" ? "furi-tap" : ""} ${showRomaji ? "inline-flex flex-col" : ""} ${className}`}
    >
      <span>{body}</span>
      {showRomaji && (
        <span lang="en" className="romaji">
          {romaji(text)}
        </span>
      )}
    </span>
  );
}
