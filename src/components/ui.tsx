import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function TopBar({ left, right, back = "/" }: { left: ReactNode; right?: ReactNode; back?: string | null }) {
  return (
    <div className="flex items-center justify-between text-sm font-bold text-mute">
      <span className="flex items-center gap-2">
        {back !== null && (
          <Link
            href={back}
            aria-label="Kembali"
            className="-ml-1 grid size-9 place-items-center rounded-full bg-surface/70 text-ink ring-1 ring-line transition hover:bg-elevated active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        {left}
      </span>
      {right && <span className="rounded-full bg-surface/70 px-2.5 py-1 text-xs ring-1 ring-line">{right}</span>}
    </div>
  );
}

export function ProgressBar({ value, tone = "lavender" }: { value: number; tone?: "lavender" | "cyan" }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const fill = tone === "cyan" ? "from-cyan to-lavender" : "from-primary to-lavender";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-elevated" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i className={`block h-full rounded-full bg-gradient-to-r ${fill} shadow-glow transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Card({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`rounded-2xl border border-line bg-surface/85 p-4 backdrop-blur-sm ${className}`} {...p} />;
}

/** Kartu yang bisa ditekan, dengan efek naik dan glow. */
export function CardLink({ className = "", ...p }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`block rounded-2xl border border-line bg-surface/85 p-4 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-lavender/60 hover:shadow-glow active:scale-[0.98] ${className}`}
      {...p}
    />
  );
}

export function Chip({ className = "", active = false, ...p }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`min-h-9 rounded-full px-3.5 text-sm font-bold transition active:scale-95 ${
        active ? "bg-primary text-ink shadow-glow" : "bg-elevated text-ink hover:bg-elevated/70 hover:text-moon"
      } disabled:opacity-50 ${className}`}
      {...p}
    />
  );
}

const btnBase =
  "block w-full rounded-2xl px-4 py-3.5 text-center font-extrabold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";
const btnVariant = {
  primary: "bg-gradient-to-r from-primary to-[#8a7dff] text-ink shadow-glow hover:brightness-110",
  alt: "bg-elevated text-ink ring-1 ring-line hover:ring-lavender/50",
};

export function Button({ variant = "primary", className = "", ...p }: ComponentProps<"button"> & { variant?: keyof typeof btnVariant }) {
  return <button type="button" className={`${btnBase} ${btnVariant[variant]} ${className}`} {...p} />;
}

export function ButtonLink({ variant = "primary", className = "", ...p }: ComponentProps<typeof Link> & { variant?: keyof typeof btnVariant }) {
  return <Link className={`${btnBase} ${btnVariant[variant]} ${className}`} {...p} />;
}

export function Muted({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`text-sm text-mute ${className}`} {...p} />;
}

export function Big({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`font-display text-[22px] leading-tight font-bold ${className}`} {...p} />;
}

export function Loading() {
  return (
    <div className="grid flex-1 place-items-center py-16">
      <div className="relative size-16">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-lavender/40 animate-orbit" />
        <div className="absolute inset-5 rounded-full bg-primary shadow-glow" />
      </div>
    </div>
  );
}

export function Spacer() {
  return <div className="flex-1" />;
}

export function Feedback({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <Card className={`animate-rise ${ok ? "border-ok/60 bg-ok/10" : "border-bad/60 bg-bad/10"}`}>{children}</Card>;
}

export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <span className={`font-extrabold ${ok ? "text-ok" : "text-bad"}`}>{children}</span>;
}

export const inputClass =
  "w-full rounded-xl border border-line bg-elevated/70 p-3 text-ink placeholder:text-mute outline-none transition focus:border-lavender focus:shadow-glow";
