import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TINT_BG, type Tint } from "./tint";

/** 문서 한 장. 가운데 정렬된 읽기 좋은 폭 */
export function DocPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-[720px] px-4 pb-28 sm:px-6", className)}>{children}</main>;
}

/** 페이지 맨 위의 큰 이모지 아이콘, 제목, 한 줄 설명 */
export function PageHeader({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <header className="pt-12 pb-6 sm:pt-20">
      <div aria-hidden className="mb-3 text-[52px] leading-none sm:text-[64px]">
        {icon}
      </div>
      <h1 className="text-[2rem] leading-tight font-bold tracking-tight sm:text-[2.5rem]">{title}</h1>
      {description && <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>}
    </header>
  );
}

export function H2({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mt-10 mb-2 text-2xl font-semibold tracking-tight", className)}>{children}</h2>;
}

export function H3({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("mt-6 mb-1.5 text-lg font-semibold", className)}>{children}</h3>;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("my-5 border-border", className)} />;
}

/** 옅은 배경색 상자. 비유(💡), 주의(⚠️) 같은 보조 설명에 쓴다 */
export function Callout({
  icon,
  tint = "gray",
  children,
  className,
}: {
  icon: string;
  tint?: Tint;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 rounded-md px-4 py-3.5", TINT_BG[tint], className)}>
      <span aria-hidden className="text-lg leading-6">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-[15px] leading-6">{children}</div>
    </div>
  );
}

/** 눌러서 펼치고 접는 블록. 브라우저 기본 details 를 써서 키보드와 화면 낭독기가 그대로 동작한다 */
export function ToggleBlock({
  summary,
  children,
  defaultOpen,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="-mx-1 flex cursor-pointer list-none items-start gap-1 rounded-md px-1 py-1 transition-colors hover:bg-hover [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden
          className="mt-[3px] size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-90"
        />
        <span className="min-w-0 flex-1">{summary}</span>
      </summary>
      <div className="pt-1 pb-2 pl-5">{children}</div>
    </details>
  );
}

/** 노션 데이터베이스의 선택 태그처럼 생긴 작은 라벨 */
export function Tag({ tint = "gray", children }: { tint?: Tint; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-[3px] px-1.5 text-xs whitespace-nowrap text-foreground",
        TINT_BG[tint],
      )}
    >
      {children}
    </span>
  );
}

/** 글 안의 짧은 코드나 영어 용어명 */
export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[4px] bg-code px-[0.35em] py-[0.15em] font-mono text-[0.85em] text-code-foreground">
      {children}
    </code>
  );
}

/**
 * 이 서비스의 대표 표현: 평소 말이 개발 용어로 바뀌는 한 줄.
 * 작은 창 뜨는 거 → 모달 Modal
 */
export function TranslationLine({ from, term, termEn }: { from: string; term: string; termEn?: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 leading-7">
      <span className="text-muted-foreground underline decoration-faint decoration-dotted underline-offset-[5px]">
        {from}
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-faint" />
      <span className="sr-only">개발 용어로는</span>
      <span className="font-semibold">{term}</span>
      {termEn && <Code>{termEn}</Code>}
    </p>
  );
}
