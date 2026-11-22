import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "./cosmic";

/** Baris judul halaman latihan: tombol kembali, judul, dan penanda langkah. */
export function TopBar({
  left,
  right,
  back = "/",
}: {
  left: ReactNode;
  right?: ReactNode;
  back?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {back !== null && (
        <Link
          href={back}
          aria-label="Kembali"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink transition hover:bg-elevated active:scale-90"
        >
          <Icon kind="back" size={18} strokeWidth={2.2} />
        </Link>
      )}
      <h1 className="min-w-0 truncate text-lg font-bold">{left}</h1>
      {right && (
        <span className="ml-auto shrink-0 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-lavender tabular-nums">
          {right}
        </span>
      )}
    </div>
  );
}

export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full bg-elevated ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i
        className="block h-full rounded-full bg-gradient-to-r from-primary to-lavender transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Card({ className = "", ...p }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-3xl bg-surface p-5 shadow-soft ${className}`}
      {...p}
    />
  );
}

/** Kartu yang bisa ditekan. */
export function CardLink({
  className = "",
  ...p
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`block rounded-3xl bg-surface p-5 shadow-soft ring-1 ring-transparent transition duration-200 hover:-translate-y-0.5 hover:ring-lavender/40 active:scale-[0.98] ${className}`}
      {...p}
    />
  );
}

export function Chip({
  className = "",
  active = false,
  ...p
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
        active
          ? "bg-primary text-ink"
          : "bg-elevated text-ink hover:bg-[#33345a]"
      } disabled:opacity-50 ${className}`}
      {...p}
    />
  );
}

// Tombol pill. Di HP selebar layar; di desktop menyesuaikan isi.
const btnBase =
  "inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 font-bold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 md:w-auto md:min-w-48";
const btnVariant = {
  primary:
    "bg-gradient-to-r from-primary to-[#8b7fff] text-ink shadow-glow hover:brightness-110",
  alt: "bg-elevated text-ink hover:bg-[#33345a]",
  light: "bg-ink text-[#2a2470] hover:bg-white",
};

export function Button({
  variant = "primary",
  className = "",
  ...p
}: ComponentProps<"button"> & { variant?: keyof typeof btnVariant }) {
  return (
    <button
      type="button"
      className={`${btnBase} ${btnVariant[variant]} ${className}`}
      {...p}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...p
}: ComponentProps<typeof Link> & { variant?: keyof typeof btnVariant }) {
  return (
    <Link className={`${btnBase} ${btnVariant[variant]} ${className}`} {...p} />
  );
}

/** Deretan tombol aksi di bawah halaman: bertumpuk di HP, sejajar kanan di desktop. */
export function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
      {children}
    </div>
  );
}

export function Muted({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`text-sm text-mute ${className}`} {...p} />;
}

export function Big({ className = "", ...p }: ComponentProps<"div">) {
  return (
    <div className={`text-2xl leading-snug font-bold ${className}`} {...p} />
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid flex-1 place-items-center py-20">
      <div className="size-10 animate-spin rounded-full border-4 border-elevated border-t-lavender" />
    </div>
  );
}

/** Mendorong tombol ke bawah layar di HP; di desktop cukup jarak kecil. */
export function Spacer() {
  return <div className="flex-1 md:h-2 md:flex-none" />;
}

export function Feedback({
  ok,
  children,
}: {
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`animate-rise rounded-3xl p-4 ring-1 ${ok ? "bg-ok/10 ring-ok/40" : "bg-bad/10 ring-bad/40"}`}
    >
      {children}
    </div>
  );
}

export function Verdict({
  ok,
  children,
}: {
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`font-bold ${ok ? "text-ok" : "text-bad"}`}>
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden rounded-md bg-black/20 px-1.5 text-[11px] font-semibold lg:inline">
      {children}
    </kbd>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-elevated"}`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-ink shadow transition-all ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-line bg-elevated/60 px-4 py-3 text-ink placeholder:text-mute outline-none transition focus:border-lavender focus:bg-elevated focus-visible:outline-none";
