import type { Skill } from "@/lib/types";
import { Planet } from "./cosmic";
import { Big, ButtonLink, Card, Muted, Spacer, TopBar } from "./ui";

export function SkillDone({ skill, title, detail }: { skill: Skill; title: string; detail: string }) {
  return (
    <>
      <TopBar left={title} />
      <Card className="animate-rise flex flex-col items-center gap-2 py-8 text-center">
        <Planet kind={skill} size={80} />
        <Big>Misi selesai</Big>
        <Muted>{detail}</Muted>
      </Card>
      <Spacer />
      <ButtonLink href="/hasil">Lihat hasil hari ini</ButtonLink>
      <ButtonLink href="/" variant="alt">
        Kembali ke beranda
      </ButtonLink>
    </>
  );
}
