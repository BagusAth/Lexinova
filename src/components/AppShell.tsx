"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  lastSaveFailed,
  requestPersistentStorage,
  streak,
  useProgress,
} from "@/lib/progress";
import { Achievement } from "./Achievement";
import { Icon, type IconKind, Logo } from "./cosmic";

const NAV: { href: string; label: string; icon: IconKind }[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/kata", label: "Kata", icon: "words" },
  { href: "/latihan", label: "Jalur", icon: "explore" },
  { href: "/hasil", label: "Progres", icon: "progress" },
];

// Halaman yang menampilkan navigasi bawah di HP. Halaman latihan memakai layar penuh.
const WITH_TABS = new Set(["/", "/kata", "/latihan", "/hasil", "/pengaturan"]);

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const p = useProgress();
  const showTabs = WITH_TABS.has(path);

  // Minta browser menyimpan data secara permanen supaya progres tidak ikut
  // terhapus saat browser membersihkan penyimpanan otomatis.
  useEffect(() => {
    requestPersistentStorage();
  }, []);

  return (
    <>
      <div className="starfield" aria-hidden="true">
        <i className="s1" />
        <i className="s2" />
      </div>

      <div className="relative z-10 lg:flex">
          {/* Sidebar desktop */}
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 p-5 lg:flex">
            <Link href="/" className="flex items-center gap-2.5 px-2 pt-1">
              <Logo />
              <span className="text-xl font-extrabold tracking-tight">
                Lexinova
              </span>
            </Link>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => {
                const active = path === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
                      active
                        ? "bg-primary text-ink shadow-glow"
                        : "text-mute hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <Icon kind={n.icon} size={20} />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              {p && (
                <div className="flex items-center gap-3 rounded-3xl bg-surface p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#fb923c] to-[#f43f5e] text-ink">
                    <Icon kind="flame" size={20} />
                  </span>
                  <div>
                    <div className="text-lg font-extrabold">
                      {streak(p)} hari
                    </div>
                    <div className="text-xs text-mute">streak belajar</div>
                  </div>
                </div>
              )}
              <Link
                href="/pengaturan"
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
                  path === "/pengaturan"
                    ? "bg-primary text-ink"
                    : "text-mute hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon kind="settings" size={20} /> Pengaturan
              </Link>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <main
              className={`mx-auto flex min-h-dvh w-full ${showTabs ? "max-w-5xl" : "max-w-2xl"} flex-col gap-6 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 lg:min-h-0 lg:px-10 lg:py-8 ${
                showTabs
                  ? "pb-28 lg:pb-10"
                  : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              }`}
            >
              {children}
            </main>
          </div>

          {/* Navigasi bawah untuk HP */}
          {showTabs && (
            <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-md rounded-full bg-surface/95 p-1.5 shadow-soft ring-1 ring-line backdrop-blur lg:hidden">
              <div className="grid grid-cols-4">
                {NAV.map((n) => {
                  const active = path === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold transition ${active ? "bg-primary text-ink" : "text-mute"}`}
                    >
                      <Icon kind={n.icon} size={20} />
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
      </div>

      {p && lastSaveFailed() && (
        <div
          role="alert"
          className="fixed inset-x-3 top-3 z-40 mx-auto max-w-md rounded-2xl bg-bad/90 px-4 py-3 text-sm font-semibold text-ink shadow-soft"
        >
          Progres gagal disimpan ke browser (penyimpanan penuh atau mode
          penyamaran). Ekspor progres di Pengaturan sebelum menutup tab.
        </div>
      )}

      {/* Di halaman ujian pop-up ditunda supaya tidak menutupi layar hasil/naik tingkat. */}
      {p && path !== "/ujian" && <Achievement p={p} />}
    </>
  );
}
