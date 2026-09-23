import type { Metadata } from "next";
import { Callout, DocPage, PageHeader } from "@/components/doc/blocks";

export const metadata: Metadata = { title: "내 단어장" };

export default function SavedPage() {
  return (
    <DocPage>
      <PageHeader icon="⭐" title="내 단어장" description="저장한 용어를 모아 보고 복습할 수 있어요." />
      <Callout icon="🛠️">단어장은 준비 중이에요.</Callout>
    </DocPage>
  );
}
