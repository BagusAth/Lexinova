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
