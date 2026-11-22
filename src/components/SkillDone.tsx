import type { Skill } from "@/lib/types";
import { Icon } from "./cosmic";
import { Actions, ButtonLink, Card, Muted, Spacer, TopBar } from "./ui";

export function SkillDone({ skill, title, detail }: { skill: Skill; title: string; detail: string }) {
  return (
    <>
      <TopBar left={title} />
      <Card className="flex flex-col items-start gap-3 p-6">
        <span className="grid size-12 place-items-center rounded-lg border border-line text-lavender">
          <Icon kind={skill} size={24} />
        </span>
        <div className="font-display text-2xl">Latihan selesai.</div>
        <Muted>{detail}</Muted>
      </Card>
      <Spacer />
      <Actions>
        <ButtonLink href="/" variant="alt">
          Kembali ke beranda
        </ButtonLink>
        <ButtonLink href="/hasil">Lihat hasil hari ini</ButtonLink>
      </Actions>
    </>
  );
}
