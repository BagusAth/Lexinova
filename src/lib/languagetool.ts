// Cek tata bahasa lewat API publik LanguageTool (gratis, ada batas pemakaian wajar).

export interface LtMatch {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: string;
}

export async function checkText(text: string, language = "en-US"): Promise<LtMatch[]> {
  const body = new URLSearchParams({ text, language });
  const res = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`LanguageTool error ${res.status}`);
  const data = (await res.json()) as {
    matches: { message: string; offset: number; length: number; replacements: { value: string }[]; rule: { id: string } }[];
  };
  return data.matches.map((m) => ({
    message: m.message,
    offset: m.offset,
    length: m.length,
    replacements: m.replacements.slice(0, 3).map((r) => r.value),
    rule: m.rule.id,
  }));
}
