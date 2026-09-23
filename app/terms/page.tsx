import type { Metadata } from "next";
import { PageShell } from "@/components/n2d/parts";
import { TermBrowser, type TermListItem } from "@/components/terms/term-browser";
import { ALL_TERMS } from "@/lib/terms/data";

export const metadata: Metadata = {
  title: "용어 사전",
  description: "만들 때 자주 쓰는 개발 용어를 분야별로 모았어요.",
};

export default function TermsPage() {
  // 목록에 필요한 항목만 브라우저로 보낸다.
  const items: TermListItem[] = ALL_TERMS.map(({ id, term, term_en, category, subcategory, definition, aliases }) => ({
    id,
    term,
    term_en,
    category,
    subcategory,
    definition,
    aliases,
  }));

  return (
    <PageShell width="narrow">
      <h1 className="text-[2rem] font-bold tracking-tight">용어 사전</h1>
      <p className="mt-2 text-muted-foreground">만들 때 자주 쓰는 개발 용어를 분야별로 모았어요.</p>
      <div className="mt-8">
        <TermBrowser terms={items} />
      </div>
    </PageShell>
  );
}
