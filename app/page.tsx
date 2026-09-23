import { Callout, DocPage, PageHeader, TranslationLine } from "@/components/doc/blocks";

export default function Home() {
  return (
    <DocPage>
      <PageHeader
        icon="🔍"
        title="번역기"
        description="만들고 싶은 기능을 평소 말투로 적으면, 개발 용어와 Claude에게 보낼 프롬프트로 바꿔 드려요."
      />
      <div className="space-y-1">
        <TranslationLine from="작은 창 뜨는 거" term="모달" termEn="Modal" />
        <TranslationLine from="저장되면 잠깐 알려주는 메시지" term="토스트" termEn="Toast" />
        <TranslationLine from="휴대폰에서도 안 깨지게" term="반응형 웹" termEn="Responsive" />
      </div>
      <Callout icon="🛠️" className="mt-8">
        입력창은 다음 단계에서 들어와요.
      </Callout>
    </DocPage>
  );
}
