import { PageShell } from "@/components/n2d/parts";

export default function Home() {
  return (
    <PageShell>
      <h1 className="text-[2rem] font-bold tracking-tight">번역기</h1>
      <p className="mt-2 text-muted-foreground">
        만들고 싶은 기능을 평소 말투로 적으면, 개발 용어로 바꾸어 명확한 지시가 가능한 프롬프트로 바꿔 드려요.
      </p>
      <p className="mt-10 rounded-2xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
        입력창은 다음 단계에서 들어와요.
      </p>
    </PageShell>
  );
}
