"use client";

// Ganti kursus bahasa (Inggris ↔ Jepang). Unit terakhir tiap kursus diingat,
// jadi saat kembali Bagus langsung melanjutkan dari tempat yang sama.

import { getUnit } from "./content";
import { activeLang, frontierUnit, type Lang } from "./levels";
import { update } from "./progress";

export function switchCourse(lang: Lang) {
  update((p) => {
    const cur = activeLang(p);
    if (cur === lang) return;
    p.settings.lastUnit[cur] = p.settings.unitId;
    const last = p.settings.lastUnit[lang];
    p.settings.unitId =
      last && getUnit(last).language === lang ? last : frontierUnit(p, lang).id;
  });
}
