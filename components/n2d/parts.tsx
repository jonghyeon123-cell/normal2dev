import { categoryOf } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** 페이지 폭. 번역기는 넓게(2단), 사전은 읽기 좋게 좁게 */
export function PageShell({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  width?: "wide" | "narrow";
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 pt-8 pb-24 sm:pt-12",
        width === "wide" ? "max-w-5xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** 번역 앱처럼 위쪽에 언어 이름이 붙은 흰 패널 */
export function Panel({
  label,
  actions,
  children,
  className,
}: {
  label: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl border bg-card shadow-[0_1px_2px_rgb(16_24_40/0.04)]", className)}>
      <div className="flex h-12 items-center justify-between gap-2 border-b px-5">
        <h2 className="text-sm font-semibold">{label}</h2>
        {actions}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

/** 사전의 품사 표시처럼 생긴 분야 라벨 */
export function CategoryLabel({ category, detail }: { category: string; detail?: string }) {
  const c = categoryOf(category);
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span className={cn("rounded-[4px] border border-current/35 px-1.5 leading-5 font-medium", c.ink)}>{c.label}</span>
      {detail && <span className="text-muted-foreground">{detail}</span>}
    </span>
  );
}

/** 영어 용어명. 사전의 발음 기호 자리에 둔다 */
export function TermEn({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[0.9em] text-muted-foreground", className)}>[{children}]</span>;
}
