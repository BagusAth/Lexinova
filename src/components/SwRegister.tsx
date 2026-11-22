"use client";

import { useEffect } from "react";

// Daftarkan service worker supaya aplikasi bisa dipasang dan dibuka offline.
// Hanya di build produksi, supaya cache tidak mengganggu saat pengembangan.
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
