import type { Item, Unit } from "./types";
import unit01 from "@content/en/unit-01.json";

// Daftar unit. Tambah unit baru: import file JSON-nya lalu masukkan ke array ini.
export const UNITS: Unit[] = [unit01 as Unit];

export function getUnit(id?: string): Unit {
  return UNITS.find((u) => u.id === id) ?? UNITS[0];
}

export function allItems(): Item[] {
  return UNITS.flatMap((u) => u.items);
}

export function findItem(id: string): Item | undefined {
  return allItems().find((i) => i.id === id);
}
