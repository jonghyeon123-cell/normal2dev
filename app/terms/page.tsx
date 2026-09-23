import type { Metadata } from "next";
import { Callout, DocPage, PageHeader } from "@/components/doc/blocks";

export const metadata: Metadata = { title: "용어 사전" };

export default function TermsPage() {
  return (
    <DocPage>
      <PageHeader icon="📖" title="용어 사전" description="웹을 만들 때 자주 쓰는 개발 용어 282개를 분야별로 모아 뒀어요." />
      <Callout icon="🛠️">용어 목록은 준비 중이에요.</Callout>
    </DocPage>
  );
}
