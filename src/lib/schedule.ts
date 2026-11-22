import type { Skill } from "./types";

// Rotasi jalur keterampilan per hari. Indeks = Date.getDay() (0 = Minggu).
export const ROTATION: (Skill | null)[] = [
  null,
  "listening",
  "writing",
  "reading",
  "speaking",
  "conversation",
  "listening",
];

export const SKILL_LABEL: Record<Skill, string> = {
  listening: "Listening",
  writing: "Writing",
  reading: "Reading",
  speaking: "Speaking",
  conversation: "Conversation",
};

export const SKILL_SHORT: Record<Skill, string> = {
  listening: "L",
  writing: "W",
  reading: "R",
  speaking: "S",
  conversation: "C",
};

export const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function skillForDate(d = new Date()): Skill | null {
  return ROTATION[d.getDay()];
}

export function formatDateId(d = new Date()): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
