"use client";

import { ArrowDown, ArrowRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { markBg } from "@/components/n2d/marks";
import { Panel } from "@/components/n2d/parts";
import { Button } from "@/components/ui/button";
import { MAX_QUERY_LENGTH } from "@/lib/search/config";
import type { ApiError, ChunkResult, SearchResponse } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import { ChunkResultGroup } from "./chunk-result";
import { PromptPanel } from "./prompt-panel";

const EXAMPLES = [
  "버튼 누르면 작은 창 뜨고, 저장되면 잠깐 알려줘",
  "휴대폰에서도 안 깨지게 해줘",
  "로그인 안 한 사람은 못 들어오게",
  "글 지우면 댓글도 같이 없어지게",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: SearchResponse }
  | { kind: "error"; message: string };

/** 조각 순서 → 고른 용어 id. 프롬프트에 들어갈 용어를 정한다 */
type Selection = Record<number, string>;

const NETWORK_ERROR = "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.";

// 입력창과 그 뒤의 형광펜 층이 글자 위치까지 똑같이 맞도록 같은 글자 스타일을 쓴다.
const TEXT_STYLE = "pr-8 text-lg leading-9 break-keep whitespace-pre-wrap [overflow-wrap:anywhere]";

function defaultSelection(chunks: ChunkResult[]): Selection {
  const selection: Selection = {};
  chunks.forEach((c, i) => {
    if (c.results[0]) selection[i] = c.results[0].term.id;
  });
  return selection;
}

export function Translator() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [selection, setSelection] = useState<Selection>({});
  const [scrollTop, setScrollTop] = useState(0);
  // 번역할 때마다 늘어나는 번호. 프롬프트 패널을 새로 시작하는 데 쓴다.
  const [searchId, setSearchId] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = state.kind === "loading";
  // 결과를 받은 뒤 문장을 고치면 형광펜 위치가 틀어지므로 그때는 칠하지 않는다.
  const highlightChunks = state.kind === "success" && text.trim() === state.data.query ? state.data.chunks : null;

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
        setState({ kind: "error", message: body && "error" in body ? body.error.message : NETWORK_ERROR });
        return;
      }
      setSelection(defaultSelection(body.chunks));
      setSearchId((id) => id + 1);
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
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
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
              {highlightChunks && <HighlightLayer text={text} chunks={highlightChunks} scrollTop={scrollTop} />}
              <textarea
                id="normal-input"
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void translate(text);
                  }
                }}
                maxLength={MAX_QUERY_LENGTH}
                spellCheck={false}
                rows={4}
                placeholder="예) 버튼 누르면 작은 창 뜨고, 저장되면 잠깐 알려줘"
                className={cn(
                  "field-sizing-content relative block max-h-80 min-h-32 w-full resize-none bg-transparent outline-none placeholder:text-faint",
                  TEXT_STYLE,
                )}
              />
              {text && (
                <button
                  type="button"
                  onClick={clear}
                  className="absolute top-1.5 right-0 z-10 grid size-7 place-items-center rounded-full text-faint transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X aria-hidden className="size-4" />
                  <span className="sr-only">입력 지우기</span>
                </button>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              <span className="hidden text-xs text-faint sm:inline">Ctrl + Enter로도 번역할 수 있어요</span>
              <Button
                type="submit"
                size="lg"
                className="ml-auto rounded-full px-5"
                disabled={!text.trim() || isLoading}
              >
                {isLoading ? "번역 중…" : "번역하기"}
              </Button>
            </div>
          </form>
        </Panel>

        <div className="flex items-center justify-center md:mt-[108px]">
          <span className="grid size-10 place-items-center rounded-full border bg-card text-muted-foreground">
            <ArrowRight aria-hidden className="hidden size-[18px] md:block" />
            <ArrowDown aria-hidden className="size-[18px] md:hidden" />
          </span>
        </div>

        <div aria-live="polite" aria-busy={isLoading}>
          {state.kind === "success" ? (
            <PromptPanel key={searchId} query={state.data.query} chunks={state.data.chunks} selection={selection} />
          ) : (
            <Panel label="프롬프트">
              <StatusArea state={state} onExample={runExample} onRetry={() => void translate(text)} />
            </Panel>
          )}
        </div>
      </div>

      {state.kind === "success" && (
        <Panel label="개발 용어">
          <p className="-mt-1 mb-4 text-sm text-muted-foreground">
            프롬프트에 쓰인 용어예요. 후보를 누르면 다른 용어로 바꿀 수 있어요.
          </p>
          <ul className="grid gap-x-6 gap-y-6 md:grid-cols-2">
            {state.data.chunks.map((chunk, i) => (
              <ChunkResultGroup
                key={`${i}-${chunk.text}`}
                chunk={chunk}
                index={i}
                selectedId={selection[i]}
                onSelect={(termId) => setSelection((prev) => ({ ...prev, [i]: termId }))}
              />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/** 입력창 뒤에 깔리는 형광펜 층. 글자는 투명하고 형광펜 배경만 보인다 */
function HighlightLayer({ text, chunks, scrollTop }: { text: string; chunks: ChunkResult[]; scrollTop: number }) {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  chunks.forEach((chunk, i) => {
    const at = text.indexOf(chunk.text, pos);
    if (at < 0) return; // 조각이 원문과 글자가 달라진 경우(합쳐진 조각 등)는 칠하지 않는다
    parts.push(text.slice(pos, at));
    parts.push(
      <mark key={i} className={cn("rounded-[3px] text-transparent [box-decoration-break:clone]", markBg(i))}>
        {chunk.text}
      </mark>,
    );
    pos = at + chunk.text.length;
  });
  parts.push(text.slice(pos));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("text-transparent", TEXT_STYLE)} style={{ transform: `translateY(${-scrollTop}px)` }}>
        {parts}
        {"\n"}
      </div>
    </div>
  );
}

function StatusArea({
  state,
  onExample,
  onRetry,
}: {
  state: Exclude<State, { kind: "success" }>;
  onExample: (example: string) => void;
  onRetry: () => void;
}) {
  if (state.kind === "idle") {
    return (
      <div>
        <p className="text-muted-foreground">만들고 싶은 기능을 적고 번역하기를 누르면 여기에 프롬프트가 나와요.</p>
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
      <div className="space-y-4 pt-2" aria-label="번역 중">
        <div className="h-5 w-11/12 animate-pulse rounded bg-secondary" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
      </div>
    );
  }

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
