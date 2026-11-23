import type { Item, Unit } from "./types";
import unit01 from "@content/en/unit-01.json";
import unit02 from "@content/en/unit-02.json";
import unit03 from "@content/en/unit-03.json";

// Daftar unit, urut sesuai jalur belajar (tingkat diambil dari kolom `level`).
// Tambah unit baru: import file JSON-nya lalu masukkan ke array ini.
export const UNITS: Unit[] = [unit01, unit02, unit03] as Unit[];

export function getUnit(id?: string): Unit {
  return UNITS.find((u) => u.id === id) ?? UNITS[0];
}

export function allItems(): Item[] {
  return UNITS.flatMap((u) => u.items);
}

export function findItem(id: string): Item | undefined {
  return allItems().find((i) => i.id === id);
}
