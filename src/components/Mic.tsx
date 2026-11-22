"use client";

export function MicButton({ listening, onStart, onStop, disabled }: { listening: boolean; onStart: () => void; onStop: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={listening ? onStop : onStart}
        aria-label={listening ? "Berhenti merekam" : "Mulai bicara"}
        className={`grid size-20 place-items-center rounded-full bg-primary transition-colors hover:bg-[#7b73ff] active:translate-y-px disabled:opacity-40 ${
          listening ? "animate-pulse-ring" : ""
        }`}
      >
        <svg width="34" height="34" viewBox="0 0 24 24">
          <rect x="9" y="3" width="6" height="11" rx="3" fill="#F4F3FF" />
          <path d="M6 11a6 6 0 0012 0M12 17v4" stroke="#F4F3FF" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      <span className="text-sm text-mute">{listening ? "Mendengarkan… ketuk untuk berhenti" : "Ketuk lalu bicara"}</span>
    </div>
  );
}
