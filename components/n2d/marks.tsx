import { cn } from "@/lib/utils";

// 문장 조각 순서대로 쓰는 형광펜 색. Tailwind 가 찾을 수 있게 전체 클래스 이름을 적는다.
const MARK_BG = ["bg-mark-1", "bg-mark-2", "bg-mark-3", "bg-mark-4", "bg-mark-5"];

export const markBg = (index: number) => MARK_BG[index % MARK_BG.length];

/** 평소 말 조각에 칠하는 형광펜 */
export function Mark({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <mark className={cn("rounded-[3px] px-[3px] py-px text-foreground [box-decoration-break:clone]", markBg(index))}>
      {children}
    </mark>
  );
}

/** 용어 쪽에 붙이는 같은 색 표시. 어느 조각에서 나온 용어인지 알려준다 */
export function MarkSwatch({ index, className }: { index: number; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-3 shrink-0 rounded-[3px]", markBg(index), className)} />;
}
