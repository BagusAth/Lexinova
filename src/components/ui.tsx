import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Baris judul halaman latihan: tombol kembali, judul, dan penanda langkah. */
export function TopBar({ left, right, back = "/" }: { left: ReactNode; right?: ReactNode; back?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {back !== null && (
        <Link
          href={back}
          aria-label="Kembali"
          className="-ml-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-mute transition-colors hover:bg-surface hover:text-ink lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      )}
      <h1 className="min-w-0 truncate font-display text-xl">{left}</h1>
      {right && <span className="label ml-auto shrink-0 tabular-nums">{right}</span>}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i className="block h-full rounded-full bg-lavender transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Card({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`rounded-xl border border-line bg-surface p-4 ${className}`} {...p} />;
}

/** Kartu yang bisa ditekan. */
export function CardLink({ className = "", ...p }: ComponentProps<typeof Link>) {
  return <Link className={`block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-lavender/50 hover:bg-elevated/60 ${className}`} {...p} />;
}

export function Chip({ className = "", active = false, ...p }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`min-h-8 rounded-lg border px-3 text-sm font-medium transition-colors ${
        active ? "border-primary bg-primary text-ink" : "border-line bg-surface text-ink hover:border-lavender/50"
      } disabled:opacity-50 ${className}`}
      {...p}
    />
  );
}

// Di HP tombol selebar layar; di desktop menyesuaikan isi dan rata kanan.
const btnBase =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-40 md:w-auto md:min-w-44 md:self-end";
const btnVariant = {
  primary: "bg-primary text-ink hover:bg-[#7b73ff]",
  alt: "border border-line bg-surface text-ink hover:border-lavender/50",
};

export function Button({ variant = "primary", className = "", ...p }: ComponentProps<"button"> & { variant?: keyof typeof btnVariant }) {
  return <button type="button" className={`${btnBase} ${btnVariant[variant]} ${className}`} {...p} />;
}

export function ButtonLink({ variant = "primary", className = "", ...p }: ComponentProps<typeof Link> & { variant?: keyof typeof btnVariant }) {
  return <Link className={`${btnBase} ${btnVariant[variant]} ${className}`} {...p} />;
}

/** Deretan tombol aksi di bawah halaman: bertumpuk di HP, sejajar di desktop. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">{children}</div>;
}

export function Muted({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`text-sm text-mute ${className}`} {...p} />;
}

export function Big({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`font-display text-2xl leading-snug ${className}`} {...p} />;
}

export function Loading() {
  return <div className="label py-16 text-center">Memuat…</div>;
}

/** Mendorong tombol ke bawah layar di HP; di desktop cukup jarak kecil. */
export function Spacer() {
  return <div className="flex-1 md:h-2 md:flex-none" />;
}

export function Feedback({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <div className={`rounded-xl border-l-2 bg-surface p-4 ${ok ? "border-ok" : "border-bad"}`}>{children}</div>;
}

export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <span className={`font-semibold ${ok ? "text-ok" : "text-bad"}`}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="hidden rounded border border-line px-1.5 font-mono text-[11px] text-mute lg:inline">{children}</kbd>;
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface p-3 text-ink placeholder:text-mute outline-none transition-colors focus:border-lavender";
