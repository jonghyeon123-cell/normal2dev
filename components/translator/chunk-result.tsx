"use client";

import { ChevronRight } from "lucide-react";
import { MarkSwatch } from "@/components/n2d/marks";
import { CategoryLabel, TermEn } from "@/components/n2d/parts";
import { SaveButton } from "@/components/n2d/save-button";
import type { ChunkResult, Term } from "@/lib/search/types";
import { cn } from "@/lib/utils";

/** 문장 조각 하나의 결과: 형광펜 색, 고른 용어 카드, 다른 후보 */
export function ChunkResultGroup({
  chunk,
  index,
  selectedId,
  onSelect,
}: {
  chunk: ChunkResult;
  index: number;
  selectedId: string | undefined;
  onSelect: (termId: string) => void;
}) {
  const selected = chunk.results.find((r) => r.term.id === selectedId) ?? chunk.results[0];

  return (
    <li>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <MarkSwatch index={index} className="mt-[4px]" />
        <span className="min-w-0">{chunk.text}</span>
      </p>

      {chunk.status === "not_found" || !selected ? (
        <div className="mt-2 rounded-xl border border-dashed px-4 py-3.5 text-sm leading-6">
          <p className="font-medium">맞는 용어를 찾지 못했어요</p>
          <p className="mt-1 text-muted-foreground">
            어디에서, 무엇을 누르면, 어떻게 되는지 적으면 찾기 쉬워요. 예) 상단 메뉴를 누르면 아래로 목록이 펼쳐지게
          </p>
        </div>
      ) : (
        <>
          {chunk.status === "uncertain" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              딱 맞는 용어가 아닐 수 있어요. 가장 가까운 것을 골라 주세요.
            </p>
          )}
          {/* key 로 용어가 바뀌면 카드를 새로 그려서 열려 있던 '더 알아보기'를 접는다 */}
          <TermCard key={selected.term.id} term={selected.term} />
          {chunk.results.length > 1 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-xs text-muted-foreground">후보</span>
              {chunk.results.map((r) => {
                const active = r.term.id === selected.term.id;
                return (
                  <button
                    key={r.term.id}
                    type="button"
                    onClick={() => onSelect(r.term.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active
                        ? "border-primary/50 bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {r.term.term}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </li>
  );
}

function TermCard({ term }: { term: Term }) {
  return (
    <article className="mt-2 rounded-xl border bg-background/50 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold">{term.term}</span>
            <TermEn>{term.term_en}</TermEn>
          </h3>
          <div className="mt-1">
            <CategoryLabel category={term.category} detail={term.subcategory} />
          </div>
        </div>
        <SaveButton termId={term.id} termName={term.term} />
      </div>

      <p className="mt-3 text-[15px] leading-7">{term.definition}</p>

      <details className="group mt-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" />더 알아보기
        </summary>
        <dl className="mt-2 space-y-3 border-l-2 pl-3 text-sm leading-6">
          <div>
            <dt className="font-semibold text-muted-foreground">비유</dt>
            <dd className="mt-0.5">{term.analogy}</dd>
          </div>
          {term.confusable && (
            <div>
              <dt className="font-semibold text-muted-foreground">헷갈리지 마세요</dt>
              <dd className="mt-0.5">{term.confusable}</dd>
            </div>
          )}
        </dl>
      </details>
    </article>
  );
}
