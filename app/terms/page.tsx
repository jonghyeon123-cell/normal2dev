import type { Metadata } from "next";
import { PageShell } from "@/components/n2d/parts";

export const metadata: Metadata = { title: "용어 사전" };

export default function TermsPage() {
  return (
    <PageShell width="narrow">
      <h1 className="text-[2rem] font-bold tracking-tight">용어 사전</h1>
      <p className="mt-2 text-muted-foreground">만들 때 자주 쓰는 개발 용어를 분야별로 모았어요.</p>
      <p className="mt-10 rounded-2xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
        용어 목록은 준비 중이에요.
      </p>
    </PageShell>
  );
}
