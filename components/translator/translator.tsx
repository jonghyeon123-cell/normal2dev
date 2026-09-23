"use client";

import { ArrowDown, ArrowRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { MarkSwatch } from "@/components/n2d/marks";
import { Panel, TermEn } from "@/components/n2d/parts";
import { Button } from "@/components/ui/button";
import { MAX_QUERY_LENGTH } from "@/lib/search/config";
import type { ApiError, ChunkStatus, SearchResponse } from "@/lib/search/types";

const EXAMPLES = [
  "버튼 누르면 작은 창 뜨고, 저장되면 잠깐 알려줘",
  "휴대폰에서도 안 깨지게 해줘",
  "로그인 안 한 사람은 못 들어오게",
  "글 지우면 댓글도 같이 없어지게",
];

const STATUS_LABEL: Record<ChunkStatus, string> = {
  matched: "추천",
  uncertain: "후보",
  not_found: "못 찾음",
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: SearchResponse }
  | { kind: "error"; message: string };

const NETWORK_ERROR = "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.";

export function Translator() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = state.kind === "loading";
  const trimmed = text.trim();

  async function translate(query: string) {
    if (!query.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => null)) as SearchResponse | ApiError | null;
      if (!res.ok || !body || "error" in body) {
        const message = body && "error" in body ? body.error.message : NETWORK_ERROR;
        setState({ kind: "error", message });
        return;
      }
      setState({ kind: "success", data: body });
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error(e);
      setState({ kind: "error", message: NETWORK_ERROR });
    }
  }

  function runExample(example: string) {
    setText(example);
    void translate(example);
  }

  function clear() {
    abortRef.current?.abort();
    setText("");
    setState({ kind: "idle" });
    textareaRef.current?.focus();
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
      <Panel
        label={<label htmlFor="normal-input">평소 말</label>}
        actions={
          <span className="text-xs text-faint tabular-nums">
            {text.length} / {MAX_QUERY_LENGTH}
          </span>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void translate(text);
          }}
          className="flex h-full flex-col"
        >
          <div className="relative">
            <textarea
              id="normal-input"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void translate(text);
                }
              }}
              maxLength={MAX_QUERY_LENGTH}
              rows={4}
              placeholder="예) 버튼 누르면 작은 창 뜨고, 저장되면 잠깐 알려줘"
              className="field-sizing-content block max-h-80 min-h-32 w-full resize-none bg-transparent pr-8 text-lg leading-9 outline-none placeholder:text-faint"
            />
            {text && (
              <button
                type="button"
                onClick={clear}
                className="absolute top-1.5 right-0 grid size-7 place-items-center rounded-full text-faint transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X aria-hidden className="size-4" />
                <span className="sr-only">입력 지우기</span>
              </button>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="hidden text-xs text-faint sm:inline">Ctrl + Enter로도 번역할 수 있어요</span>
            <Button type="submit" size="lg" className="ml-auto rounded-full px-5" disabled={!trimmed || isLoading}>
              {isLoading ? "번역 중…" : "번역하기"}
            </Button>
          </div>
        </form>
      </Panel>

      <div className="flex items-center justify-center">
        <span className="grid size-10 place-items-center rounded-full border bg-card text-muted-foreground">
          <ArrowRight aria-hidden className="hidden size-[18px] md:block" />
          <ArrowDown aria-hidden className="size-[18px] md:hidden" />
        </span>
      </div>

      <Panel label="개발 용어">
        <div aria-live="polite" aria-busy={isLoading}>
          <ResultArea state={state} onExample={runExample} onRetry={() => void translate(text)} />
        </div>
      </Panel>
    </div>
  );
}

function ResultArea({
  state,
  onExample,
  onRetry,
}: {
  state: State;
  onExample: (example: string) => void;
  onRetry: () => void;
}) {
  if (state.kind === "idle") {
    return (
      <div>
        <p className="text-muted-foreground">만들고 싶은 기능을 적고 번역하기를 누르면 여기에 개발 용어가 나와요.</p>
        <p className="mt-6 text-xs font-semibold text-muted-foreground">예시로 해 보기</p>
        <ul className="mt-2 flex flex-col items-start gap-2">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => onExample(example)}
                className="rounded-full border px-3.5 py-1.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <ul className="-my-2 divide-y" aria-label="번역 중">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-start gap-3 py-3">
            <span className="mt-[7px] size-3 rounded-[3px] bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (state.kind === "error") {
    return (
      <div role="alert">
        <p className="font-medium">번역하지 못했어요</p>
        <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    );
  }

  // 5-3 단계에서 용어 카드로 바꾼다. 지금은 조각별 결과를 간단한 목록으로 보여준다.
  return (
    <ul className="-my-2 divide-y">
      {state.data.chunks.map((chunk, i) => (
        <li key={`${i}-${chunk.text}`} className="py-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MarkSwatch index={i} />
            <span className="min-w-0 truncate">{chunk.text}</span>
            <span className="ml-auto shrink-0 text-xs text-faint">{STATUS_LABEL[chunk.status]}</span>
          </p>
          {chunk.results.length > 0 ? (
            <ul className="mt-1.5 space-y-1 pl-5">
              {chunk.results.map((r) => (
                <li key={r.term.id}>
                  <span className="font-semibold">{r.term.term}</span>{" "}
                  <TermEn className="ml-0.5">{r.term.term_en}</TermEn>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 pl-5 text-sm">맞는 용어를 찾지 못했어요. 조금 더 자세히 적어 주세요.</p>
          )}
        </li>
      ))}
    </ul>
  );
}
