import type { Metadata } from "next";
import {
  Callout,
  Code,
  Divider,
  DocPage,
  H2,
  H3,
  PageHeader,
  Tag,
  ToggleBlock,
  TranslationLine,
} from "@/components/doc/blocks";
import { TINT_BG, type Tint } from "@/components/doc/tint";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";

// 디자인 확인용 샘플 페이지. 5-7 단계에서 정리한다.
export const metadata: Metadata = { title: "디자인 샘플", robots: { index: false } };

const TINTS: Tint[] = ["gray", "orange", "yellow", "green", "blue", "purple", "red"];

export default function DesignPage() {
  return (
    <DocPage>
      <PageHeader icon="🎨" title="디자인 샘플" description="화면에 쓰는 글꼴, 색, 블록 부품을 한 페이지에 모았어요." />

      <H2>번역 줄</H2>
      <p className="mb-3 text-muted-foreground">평소 말이 개발 용어로 바뀌는 모습을 한 줄로 보여줘요.</p>
      <div className="space-y-1">
        <TranslationLine from="작은 창 뜨는 거" term="모달" termEn="Modal" />
        <TranslationLine from="글 지우면 댓글도 같이 없어지게" term="연쇄 삭제" termEn="ON DELETE CASCADE" />
      </div>

      <Divider />

      <H2>용어 블록 예시</H2>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Tag tint="blue">프론트엔드</Tag>
        <Tag tint="gray">UI 컴포넌트</Tag>
      </div>
      <H3 className="mt-3">
        모달 <Code>Modal</Code>
      </H3>
      <p className="leading-7">
        화면 한가운데에 겹쳐서 뜨는 작은 창이에요. 모달이 떠 있는 동안에는 뒤쪽 화면이 어둡게 가려지고 클릭할 수
        없어요. 창을 닫아야 원래 화면을 다시 쓸 수 있어요.
      </p>
      <div className="mt-4 space-y-2">
        <Callout icon="💡" tint="yellow">
          책상 위에 서류를 펼쳐 놓았는데 누군가 그 위에 쪽지를 올려놓은 것과 같아요. 쪽지를 치워야 서류를 다시 볼 수
          있죠.
        </Callout>
        <Callout icon="⚠️" tint="red">
          모달은 창을 닫기 전까지 뒤 화면을 쓸 수 없어요. 잠깐 떴다 사라지는 건 <strong>토스트</strong>, 마우스를
          올리면 뜨는 작은 설명은 <strong>툴팁</strong>이에요.
        </Callout>
      </div>
      <div className="mt-4">
        <ToggleBlock summary={<span className="font-medium">이렇게 요청해 보세요</span>}>
          <p className="leading-7 text-muted-foreground">
            버튼을 클릭하면 모달(Modal)이 열리게 해 주세요. 배경은 반투명하게 어둡게 처리하고, 바깥 영역을 클릭하거나
            ESC 키를 누르면 닫히게 해 주세요.
          </p>
        </ToggleBlock>
        <ToggleBlock summary="이렇게도 말해요">
          <p className="leading-7 text-muted-foreground">작은 창 뜨는 거 · 팝업창 · 화면 위에 겹쳐 나오는 창</p>
        </ToggleBlock>
      </div>

      <Divider />

      <H2>분야별 태그</H2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(CATEGORIES).map(([key, c]) => (
          <Tag key={key} tint={c.tint}>
            {c.label}
          </Tag>
        ))}
      </div>

      <H2>콜아웃 색</H2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TINTS.map((t) => (
          <div key={t} className={`rounded-md px-3 py-2.5 text-sm ${TINT_BG[t]}`}>
            {t}
          </div>
        ))}
      </div>

      <H2>글자</H2>
      <div className="mt-3 space-y-2">
        <p className="text-[2.5rem] leading-tight font-bold tracking-tight">페이지 제목</p>
        <p className="text-2xl font-semibold tracking-tight">큰 제목</p>
        <p className="text-lg font-semibold">작은 제목</p>
        <p className="leading-7">본문이에요. 한국어 문장이 편하게 읽히도록 줄 간격을 넉넉하게 잡았어요.</p>
        <p className="text-sm text-muted-foreground">보조 설명은 한 단계 연한 색으로 써요.</p>
        <p className="text-sm text-faint">가장 옅은 글자는 입력 안내처럼 덜 중요한 곳에만 써요.</p>
      </div>

      <H2>버튼</H2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button>프롬프트 복사</Button>
        <Button variant="outline">다시 검색</Button>
        <Button variant="ghost">예시 보기</Button>
        <Button disabled>복사 중…</Button>
      </div>
    </DocPage>
  );
}
