import { ArrowDown, ArrowRight, Star } from "lucide-react";
import type { Metadata } from "next";
import { Mark, MarkSwatch } from "@/components/n2d/marks";
import { CategoryLabel, PageShell, Panel, TermEn } from "@/components/n2d/parts";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";

// 디자인 확인용 샘플 페이지. 마무리 단계에서 정리한다.
export const metadata: Metadata = { title: "디자인 샘플", robots: { index: false } };

const SAMPLE_TERMS = [
  { mark: 0, term: "모달", en: "Modal", gist: "화면 가운데에 겹쳐 뜨는 작은 창" },
  { mark: 1, term: "토스트", en: "Toast", gist: "잠깐 떴다가 저절로 사라지는 알림" },
  { mark: 2, term: "반응형 웹", en: "Responsive", gist: "화면 크기에 맞춰 배치가 바뀌는 방식" },
];

function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mt-14 mb-4 first:mt-0">
      <h2 className="text-xl font-bold tracking-tight">{children}</h2>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

export default function DesignPage() {
  return (
    <PageShell>
      <SectionTitle note="평소 말의 조각과 개발 용어를 같은 색 형광펜으로 짝지어요.">번역기 화면</SectionTitle>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
        <Panel label="평소 말" actions={<span className="text-xs text-faint">48 / 300</span>}>
          <p className="text-lg leading-9">
            <Mark index={0}>버튼 누르면 작은 창 뜨고</Mark>, <Mark index={1}>저장되면 잠깐 알려줘</Mark>. 그리고{" "}
            <Mark index={2}>휴대폰에서도 안 깨지게</Mark>
          </p>
          <div className="mt-6 flex justify-end">
            <Button size="lg" className="rounded-full px-5">
              번역하기
            </Button>
          </div>
        </Panel>

        <div className="flex items-center justify-center">
          <span className="grid size-10 place-items-center rounded-full border bg-card text-muted-foreground">
            <ArrowRight aria-hidden className="hidden size-[18px] md:block" />
            <ArrowDown aria-hidden className="size-[18px] md:hidden" />
          </span>
        </div>

        <Panel label="개발 용어">
          <ul className="-my-2 divide-y">
            {SAMPLE_TERMS.map((t) => (
              <li key={t.term} className="flex items-start gap-3 py-3">
                <MarkSwatch index={t.mark} className="mt-[7px]" />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t.term} <TermEn className="ml-1 font-normal">{t.en}</TermEn>
                  </p>
                  <p className="text-sm text-muted-foreground">{t.gist}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="mt-4 w-full rounded-full">
            이 용어로 프롬프트 만들기
          </Button>
        </Panel>
      </div>

      <SectionTitle note="사전처럼 표제어를 크게, 영어 이름은 발음 기호 자리에 둬요.">용어 사전 화면</SectionTitle>

      <article className="rounded-2xl border bg-card px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-[2rem] leading-tight font-bold tracking-tight">모달</h3>
          <TermEn className="text-base">Modal</TermEn>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 self-center rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Star aria-hidden className="size-4" />
            저장
          </button>
        </div>
        <div className="mt-2">
          <CategoryLabel category="FE" detail="UI 컴포넌트" />
        </div>

        <p className="mt-5 text-[17px] leading-8">
          화면 한가운데에 겹쳐서 뜨는 작은 창이에요. 모달이 떠 있는 동안에는 뒤쪽 화면이 어둡게 가려지고 클릭할 수
          없어요. 창을 닫아야 원래 화면을 다시 쓸 수 있어요.
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t pt-6 text-[15px] leading-7 sm:grid-cols-[6.5rem_1fr]">
          <dt className="font-semibold text-muted-foreground">비유</dt>
          <dd>
            책상 위에 서류를 펼쳐 놓았는데 누군가 그 위에 쪽지를 올려놓은 것과 같아요. 쪽지를 치워야 서류를 다시 볼
            수 있죠.
          </dd>
          <dt className="font-semibold text-muted-foreground">헷갈리지 마세요</dt>
          <dd>
            잠깐 떴다 사라지는 건 <strong>토스트</strong>, 마우스를 올리면 뜨는 작은 설명은 <strong>툴팁</strong>
            이에요.
          </dd>
          <dt className="font-semibold text-muted-foreground">이렇게도 말해요</dt>
          <dd className="text-muted-foreground">작은 창 뜨는 거 · 팝업창 · 화면 위에 겹쳐 나오는 창</dd>
        </dl>

        <div className="mt-6 rounded-xl bg-secondary px-4 py-3.5">
          <p className="text-xs font-semibold text-muted-foreground">요청 예문</p>
          <p className="mt-1 text-[15px] leading-7">
            버튼을 클릭하면 <span className="font-semibold text-primary">모달(Modal)</span>이 열리게 해 주세요. 배경은
            반투명하게 어둡게 처리하고, 바깥 영역을 클릭하거나 ESC 키를 누르면 닫히게 해 주세요.
          </p>
        </div>
      </article>

      <SectionTitle>분야 라벨</SectionTitle>
      <div className="flex flex-wrap gap-3">
        {Object.keys(CATEGORIES).map((key) => (
          <CategoryLabel key={key} category={key} />
        ))}
      </div>

      <SectionTitle note="문장이 최대 5조각으로 나뉘어서 형광펜도 5가지예요.">형광펜</SectionTitle>
      <p className="text-lg leading-9">
        {["첫 번째 조각", "두 번째 조각", "세 번째 조각", "네 번째 조각", "다섯 번째 조각"].map((text, i) => (
          <span key={text}>
            <Mark index={i}>{text}</Mark>{" "}
          </span>
        ))}
      </p>

      <SectionTitle>버튼</SectionTitle>
      <div className="flex flex-wrap gap-2">
        <Button size="lg" className="rounded-full px-5">
          번역하기
        </Button>
        <Button variant="outline" size="lg" className="rounded-full">
          프롬프트 복사
        </Button>
        <Button variant="ghost" size="lg" className="rounded-full">
          예시 보기
        </Button>
        <Button size="lg" className="rounded-full px-5" disabled>
          번역 중…
        </Button>
      </div>
    </PageShell>
  );
}
