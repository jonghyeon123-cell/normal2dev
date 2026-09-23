"use client";

import { ArrowUp, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CategoryLabel, TermEn } from "@/components/n2d/parts";
import { SaveButton } from "@/components/n2d/save-button";
import { CATEGORIES } from "@/lib/categories";
import { useSavedTerms } from "@/lib/saved-terms";
import { INITIAL_ORDER, initialOf } from "@/lib/terms/initial";
import { cn } from "@/lib/utils";

export type TermListItem = {
  id: string;
  term: string;
  term_en: string;
  category: string;
  subcategory: string;
  definition: string;
  aliases: string[];
};

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");

// 상단 메뉴(56px) + 색인 줄(44px). 묶음 머리글은 이 아래에 붙는다.
const STICKY_OFFSET = 100;

export function TermBrowser({ terms }: { terms: TermListItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const { ids: savedIds } = useSavedTerms();

  // 검색어는 공백을 무시하고 용어 이름, 영어 이름, 일상 표현에서 찾는다.
  const searchIndex = useMemo(
    () => new Map(terms.map((t) => [t.id, normalize([t.term, t.term_en, ...t.aliases].join("|"))])),
    [terms],
  );

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery);
    return terms.filter(
      (t) =>
        (category === "all" || t.category === category) &&
        (!savedOnly || savedIds.includes(t.id)) &&
        (!q || searchIndex.get(t.id)!.includes(q)),
    );
  }, [terms, deferredQuery, category, savedOnly, savedIds, searchIndex]);

  const groups = useMemo(() => {
    const map = new Map<string, TermListItem[]>();
    for (const t of filtered) {
      const key = initialOf(t.term);
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return INITIAL_ORDER.filter((k) => map.has(k)).map((k) => ({ initial: k, items: map.get(k)! }));
  }, [filtered]);

  const countByCategory = (key: string) => terms.filter((t) => key === "all" || t.category === key).length;

  // 지금 화면 위쪽에 걸쳐 있는 묶음을 색인에 강조한다.
  const [activeInitial, setActiveInitial] = useState<string | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const heading of document.querySelectorAll<HTMLElement>("[data-initial]")) {
        if (heading.parentElement!.getBoundingClientRect().top <= STICKY_OFFSET + 1) current = heading.dataset.initial!;
      }
      setActiveInitial(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [groups]);

  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  // 좁은 화면에서 강조된 글자가 색인 밖으로 숨지 않게 색인을 옆으로 민다.
  const indexRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = indexRef.current;
    const active = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !active) return;
    const left = active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2;
    nav.scrollTo({ left, behavior: "smooth" });
  }, [activeInitial]);

  return (
    <div>
      <div className="relative">
        <Search aria-hidden className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예) 모달, 작은 창"
          aria-label="용어 검색"
          className="h-12 w-full rounded-full border bg-card pr-11 pl-11 text-base outline-none placeholder:text-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-faint hover:bg-secondary hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">검색어 지우기</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="분야" className="flex flex-wrap gap-1.5">
          {[["all", "전체"] as const, ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.label] as const)].map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  category === key
                    ? "border-foreground bg-foreground font-semibold text-background"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {label} <span className="tabular-nums opacity-60">{countByCategory(key)}</span>
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => setSavedOnly((v) => !v)}
          aria-pressed={savedOnly}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
            savedOnly ? "border-mark-1 bg-mark-1 font-semibold" : "bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Star aria-hidden className={cn("size-4", savedOnly && "fill-current")} />
          저장한 용어 <span className="tabular-nums opacity-60">{savedIds.length}</span>
        </button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length}개의 용어
      </p>

      {/* 스크롤해도 상단 메뉴 바로 아래에 붙어 있는 색인 줄. 좁은 화면에서는 색인만 옆으로 밀고, 맨 위로 버튼은 오른쪽에 고정한다 */}
      {groups.length > 0 && (
        <div className="sticky top-14 z-20 -mx-4 mt-2 flex h-11 items-center border-b bg-background/95 pr-4 backdrop-blur-sm sm:-mx-1 sm:pr-1">
          <nav
            ref={indexRef}
            aria-label="첫 글자 색인"
            className="flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto pl-4 [scrollbar-width:none] sm:pl-1"
          >
            {groups.map((g) => (
              <a
                key={g.initial}
                href={`#initial-${g.initial}`}
                aria-current={activeInitial === g.initial ? "location" : undefined}
                className={cn(
                  "grid h-8 min-w-8 shrink-0 place-items-center rounded-md px-1.5 text-sm font-semibold transition-colors",
                  activeInitial === g.initial
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                {g.initial}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={scrollToTop}
            className="ml-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-md border-l pr-1.5 pl-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowUp aria-hidden className="size-4" />
            <span className="max-sm:sr-only">맨 위로</span>
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyResult savedOnly={savedOnly} hasSaved={savedIds.length > 0} hasQuery={!!query} />
      ) : (
        <div className="mt-2 space-y-8">
          {groups.map((g) => (
            // 색인 링크는 묶음 전체로 이동한다. 따라다니는 머리글로 이동하면 브라우저가 위치를 잘못 잡는다.
            <section
              key={g.initial}
              id={`initial-${g.initial}`}
              aria-labelledby={`initial-heading-${g.initial}`}
              className="scroll-mt-[100px]"
            >
              <h2
                id={`initial-heading-${g.initial}`}
                data-initial={g.initial}
                className="sticky top-[100px] z-10 -mx-1 border-b bg-background/90 px-1 py-2 text-2xl font-bold backdrop-blur-sm"
              >
                {g.initial}
              </h2>
              <ul className="divide-y">
                {g.items.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 py-1">
                    <Link
                      href={`/terms/${t.id}`}
                      className="group -mx-3 min-w-0 flex-1 rounded-xl px-3 py-3 transition-colors hover:bg-card"
                    >
                      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-lg font-bold group-hover:text-primary">{t.term}</span>
                        <TermEn>{t.term_en}</TermEn>
                        <CategoryLabel category={t.category} />
                      </p>
                      <p className="mt-1 line-clamp-2 text-[15px] leading-7 text-muted-foreground">{t.definition}</p>
                    </Link>
                    <SaveButton termId={t.id} termName={t.term} className="mt-3.5" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyResult({ savedOnly, hasSaved, hasQuery }: { savedOnly: boolean; hasSaved: boolean; hasQuery: boolean }) {
  const message =
    savedOnly && !hasSaved
      ? "아직 저장한 용어가 없어요. 번역기나 용어 사전에서 ☆ 저장을 누르면 여기에 모여요."
      : hasQuery
        ? "찾는 용어가 없어요. 다른 말로 검색하거나, 번역기에 평소 말투로 적어 보세요."
        : "조건에 맞는 용어가 없어요.";

  return (
    <div className="mt-6 rounded-2xl border border-dashed px-5 py-10 text-center">
      <p className="text-muted-foreground">{message}</p>
      {hasQuery && (
        <Link href="/" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          번역기로 가기
        </Link>
      )}
    </div>
  );
}
