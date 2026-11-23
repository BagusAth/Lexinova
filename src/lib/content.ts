import type { Item, Unit } from "./types";
import unit01 from "@content/en/unit-01.json";
import unit02 from "@content/en/unit-02.json";
import unit03 from "@content/en/unit-03.json";
import unit04 from "@content/en/unit-04.json";
import unit05 from "@content/en/unit-05.json";
import unit06 from "@content/en/unit-06.json";
import unit07 from "@content/en/unit-07.json";
import unit08 from "@content/en/unit-08.json";
import unit09 from "@content/en/unit-09.json";
import unit10 from "@content/en/unit-10.json";
import ja01 from "@content/ja/unit-01.json";
import ja02 from "@content/ja/unit-02.json";
import ja03 from "@content/ja/unit-03.json";
import ja04 from "@content/ja/unit-04.json";
import ja05 from "@content/ja/unit-05.json";
import ja06 from "@content/ja/unit-06.json";
import ja07 from "@content/ja/unit-07.json";
import ja08 from "@content/ja/unit-08.json";
import ja09 from "@content/ja/unit-09.json";
import ja10 from "@content/ja/unit-10.json";
import ja11 from "@content/ja/unit-11.json";
import ja12 from "@content/ja/unit-12.json";

// Daftar unit, urut sesuai jalur belajar (tingkat diambil dari kolom `level`).
// Tambah unit baru: import file JSON-nya lalu masukkan ke array ini.
export const UNITS: Unit[] = [
  unit01, // B1
  unit02, // B1
  unit03, // B1+
  unit04, // B1+
  unit05, // B2
  unit06, // B2
  unit07, // B2+
  unit08, // B2+
  unit09, // C1
  unit10, // C1
  // Bahasa Jepang
  ja01, // Kana: hiragana
  ja02, // Kana: katakana
  ja03, // N5
  ja04, // N5
  ja05, // N4
  ja06, // N4
  ja07, // N3
  ja08, // N3
  ja09, // N2
  ja10, // N2
  ja11, // N1
  ja12, // N1
] as Unit[];

export function getUnit(id?: string): Unit {
  return UNITS.find((u) => u.id === id) ?? UNITS[0];
}

export function allItems(): Item[] {
  return UNITS.flatMap((u) => u.items);
}

export function findItem(id: string): Item | undefined {
  return allItems().find((i) => i.id === id);
}
