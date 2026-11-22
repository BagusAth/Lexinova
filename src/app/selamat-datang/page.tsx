"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { importJson, update } from "@/lib/progress";
import { Logo, Planet, Sparkle } from "@/components/cosmic";
import { Button, inputClass } from "@/components/ui";

export default function SelamatDatang() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function start() {
    update((d) => {
      d.settings.onboarded = true;
      if (name.trim()) d.settings.name = name.trim();
    });
    router.replace("/");
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    try {
      importJson(await f.text());
      update((d) => void (d.settings.onboarded = true));
      router.replace("/");
    } catch (e) {
      setErr(`Gagal impor: ${(e as Error).message}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Ilustrasi */}
      <div className="relative mx-auto mt-6 grid h-72 w-full place-items-center">
        <div className="absolute size-64 rounded-full bg-primary/25 blur-3xl" />
        <div
          className="absolute top-2 right-6 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <Planet id="welcome-small" tone="cyan" size={56} ring={false} />
        </div>
        <div
          className="absolute bottom-6 left-4 animate-float"
          style={{ animationDelay: "2s" }}
        >
          <Planet id="welcome-pink" tone="pink" size={44} ring={false} />
        </div>
        <Sparkle className="absolute top-10 left-10" size={16} />
        <Sparkle
          className="absolute right-12 bottom-14"
          size={12}
          color="#C5B8FF"
          delay={0.7}
        />
        <Sparkle
          className="absolute top-24 right-24"
          size={8}
          color="#7DD3FC"
          delay={1.3}
        />
        <div className="animate-float">
          <Planet id="welcome-main" tone="violet" size={190} />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <Logo size={40} />
          <h1 className="text-4xl font-extrabold tracking-tight">Lexinova</h1>
        </div>
        <p className="text-lg font-semibold text-lavender">
          Your universe of words
        </p>
        <p className="max-w-xs text-mute">
          Belajar bahasa Inggris sedikit demi sedikit setiap hari: kosakata,
          mendengar, membaca, menulis, dan berbicara.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama panggilanmu (opsional)"
          className={`${inputClass} text-center`}
          maxLength={30}
        />
        <Button className="md:w-full" onClick={start}>
          Mulai sekarang
        </Button>
        <Button
          variant="alt"
          className="md:w-full"
          onClick={() => fileRef.current?.click()}
        >
          Impor progres
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {err && <p className="text-center text-sm text-bad">{err}</p>}
      </div>
    </div>
  );
}
