"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { streak, useProgress } from "@/lib/progress";
import { SKILL_LABEL, skillForDate } from "@/lib/schedule";
import type { Skill } from "@/lib/types";
import { Icon, Logo } from "./cosmic";

const SKILLS = Object.keys(SKILL_LABEL) as Skill[];

// Halaman utama yang tampil di tab bawah (HP). Halaman latihan memakai layar penuh.
const TABS = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/fondasi", label: "Fondasi", icon: "fondasi" },
  { href: "/latihan", label: "Latihan", icon: "latihan" },
  { href: "/hasil", label: "Hasil", icon: "hasil" },
  { href: "/pengaturan", label: "Atur", icon: "pengaturan" },
] as const;

const TOP_LEVEL = new Set(["/", "/latihan", "/hasil", "/pengaturan"]);

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-elevated text-ink" : "text-mute hover:bg-surface hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const p = useProgress();
  // Tanggal hanya dibaca di browser (p bernilai null saat prerender di server).
  const today = p ? skillForDate() : null;
  const showTabs = TOP_LEVEL.has(path);

  return (
    <div className="lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line bg-bg/80 px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2 px-2">
          <Logo />
          <span className="font-display text-xl">Lexinova</span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          <NavLink href="/" active={path === "/"}>
            <Icon kind="home" size={18} /> Beranda
          </NavLink>
          <NavLink href="/fondasi" active={path === "/fondasi"}>
            <Icon kind="fondasi" size={18} /> Fondasi
          </NavLink>
        </nav>

        <nav className="flex flex-col gap-0.5">
          <div className="label px-3 pb-1">Keterampilan</div>
          {SKILLS.map((s) => (
            <NavLink key={s} href={`/${s}`} active={path === `/${s}`}>
              <Icon kind={s} size={18} />
              {SKILL_LABEL[s]}
              {today === s && <span className="ml-auto size-1.5 rounded-full bg-cyan" title="Jadwal hari ini" />}
            </NavLink>
          ))}
        </nav>

        <nav className="mt-auto flex flex-col gap-0.5">
          <NavLink href="/hasil" active={path === "/hasil"}>
            <Icon kind="hasil" size={18} /> Hasil hari ini
          </NavLink>
          <NavLink href="/pengaturan" active={path === "/pengaturan"}>
            <Icon kind="pengaturan" size={18} /> Pengaturan
          </NavLink>
          {p && (
            <div className="label mt-3 px-3">
              Streak <span className="text-cyan">{streak(p)} hari</span>
            </div>
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <main
          className={`mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:min-h-0 lg:px-10 lg:py-10 ${
            showTabs ? "pb-24 lg:pb-10" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Tab bawah untuk HP */}
      {showTabs && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-2xl grid-cols-5">
            {TABS.map((t) => {
              const active = path === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-lavender" : "text-mute"}`}
                >
                  <Icon kind={t.icon} size={20} />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
