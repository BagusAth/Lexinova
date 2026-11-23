"use client";

import { useEffect } from "react";
import { sfx } from "@/lib/sfx";
import type { Skill } from "@/lib/types";
import { Confetti } from "./motion";
import { Planet, SKILL_TONE, Sparkle } from "./cosmic";
import { Actions, ButtonLink, Spacer, TopBar } from "./ui";

export function SkillDone({
  skill,
  title,
  detail,
}: {
  skill: Skill | "grammar";
  title: string;
  detail: string;
}) {
  useEffect(() => sfx("complete"), []);
  return (
    <>
      <Confetti count={50} />
      <TopBar left={title} />
      <div className="card-nebula animate-pop relative flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] px-6 py-10 text-center">
        <Sparkle className="absolute top-6 left-10" />
        <Sparkle
          className="absolute top-12 right-12"
          size={10}
          color="#7DD3FC"
          delay={0.7}
        />
        <Sparkle className="absolute bottom-8 left-1/3" size={8} delay={1.4} />
        <div className="animate-badge-in">
          <Planet id={`done-${skill}`} tone={SKILL_TONE[skill]} size={110} />
        </div>
        <h2 className="text-2xl font-extrabold">Latihan selesai!</h2>
        <p className="text-ink/80">{detail}</p>
      </div>
      <Spacer />
      <Actions>
        <ButtonLink href="/" variant="alt">
          Ke beranda
        </ButtonLink>
        <ButtonLink href="/hasil">Lihat progres</ButtonLink>
      </Actions>
    </>
  );
}
