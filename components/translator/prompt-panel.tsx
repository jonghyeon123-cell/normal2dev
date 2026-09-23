"use client";

import { Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/n2d/parts";
import { Button } from "@/components/ui/button";
import type { PromptRequest, PromptResponse } from "@/lib/prompt/api-types";
import {
  composePrompt,
  DEFAULT_PROMPT_OPTIONS,
  pickedTerms,
  PROMPT_OPTION_LABELS,
  type PromptOptions,
  templateItems,
} from "@/lib/prompt/build";
import type { ChunkResult, Term } from "@/lib/search/types";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

/**
 * AI 결과. sig 는 어떤 용어 선택으로 만든 결과인지, terms 는 그때 고른 용어다.
 * 용어를 바꾼 뒤에도 다시 만들기 전까지는 예전 문장과 예전 용어의 세부 요구사항을 함께 보여준다.
 */
type AiState =
  | { sig: string; status: "loading" }
  | { sig: string; status: "done"; items: string[]; terms: (Term | null)[] }
  | { sig: string; status: "failed" };

async function fetchItems(req: PromptRequest, signal: AbortSignal): Promise<string[]> {
  const res = await fetch("/api/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  const body = (await res.json().catch(() => null)) as PromptResponse | null;
  if (!res.ok || !body?.items?.length) throw new Error(`HTTP ${res.status}`);
  return body.items;
}

/** 번역 결과인 프롬프트. AI(Gemini)가 다듬고, 직접 고치고 복사할 수 있다 */
export function PromptPanel({
  query,
  chunks,
  selection,
}: {
  query: string;
  chunks: ChunkResult[];
  selection: Record<number, string>;
}) {
  const [options, setOptions] = useState<PromptOptions>(DEFAULT_PROMPT_OPTIONS);
  // 사용자가 직접 고친 내용과, 고치기 시작할 때의 자동 프롬프트. null 이면 자동 프롬프트를 보여준다.
  const [edited, setEdited] = useState<{ text: string; base: string } | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  // 조각마다 지금 고른 용어와, AI 에 보낼 내용. 고른 용어가 같으면 같은 결과를 쓴다.
  const terms = useMemo(() => pickedTerms(chunks, selection), [chunks, selection]);
  const request = useMemo<PromptRequest>(
    () => ({ query, chunks: chunks.map((c, i) => ({ text: c.text, termId: terms[i]?.id ?? null })) }),
    [query, chunks, terms],
  );
  const sig = JSON.stringify(request);
  const [ai, setAi] = useState<AiState>({ sig, status: "loading" });

  // AI 요청을 보내고, 결과가 오면 그때 상태를 바꾼다.
  function requestPrompt(req: PromptRequest, reqSig: string, reqTerms: (Term | null)[]) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchItems(req, controller.signal).then(
      (items) => setAi({ sig: reqSig, status: "done", items, terms: reqTerms }),
      (e) => {
        if (controller.signal.aborted) return;
        console.warn("[prompt] AI 결과를 받지 못해 템플릿으로 대신 보여줘요:", e);
        setAi({ sig: reqSig, status: "failed" });
      },
    );
  }

  /** "다시 만들기", "다시 시도" 버튼 */
  function generate() {
    setAi({ sig, status: "loading" });
    setEdited(null);
    requestPrompt(request, sig, terms);
  }

  // 새 번역 결과가 오면(이 패널이 새로 그려지면) 한 번 만든다. 처음 상태가 이미 로딩이라 요청만 보낸다.
  useEffect(() => {
    requestPrompt(request, sig, terms);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 한 번만 자동으로 만든다
  }, []);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  // AI 가 실패하면 지금 고른 용어로 만든 템플릿 문장을 대신 쓴다.
  const generated =
    ai.status === "done"
      ? composePrompt(ai.items, ai.terms, options)
      : ai.status === "failed"
        ? composePrompt(templateItems(chunks, terms), terms, options)
        : "";
  const prompt = edited?.text ?? generated;
  const isLoading = ai.status === "loading";
  // AI 결과를 만든 뒤 용어를 바꿨는지
  const isAiStale = ai.status === "done" && ai.sig !== sig;
  // 직접 고친 뒤에 자동 프롬프트가 달라졌는지
  const isEditOutdated = edited !== null && edited.base !== generated;

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
    } catch {
      // 클립보드 권한이 막힌 환경에서는 입력창 내용을 선택해서 복사하는 예전 방식으로 한 번 더 시도한다.
      const textarea = document.getElementById("prompt-output") as HTMLTextAreaElement | null;
      textarea?.select();
      setCopyState(textarea && document.execCommand("copy") ? "copied" : "failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <Panel
      label={<label htmlFor="prompt-output">프롬프트</label>}
      actions={
        <Button size="sm" className="rounded-full px-3" onClick={copy} disabled={isLoading} aria-live="polite">
          {copyState === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사하지 못했어요" : "복사"}
        </Button>
      }
    >
      <div aria-live="polite" aria-busy={isLoading}>
        {isAiStale && (
          <Notice>
            <span>용어를 바꿨어요.</span>
            <NoticeButton onClick={generate} icon={<Sparkles aria-hidden className="size-3.5" />}>
              바뀐 용어로 다시 만들기
            </NoticeButton>
          </Notice>
        )}
        {ai.status === "failed" && (
          <Notice>
            <span>AI가 잠시 응답하지 않아 기본 방식으로 만들었어요.</span>
            <NoticeButton onClick={generate} icon={<RotateCcw aria-hidden className="size-3.5" />}>
              다시 시도
            </NoticeButton>
          </Notice>
        )}
        {isEditOutdated && !isAiStale && (
          <Notice>
            <span>직접 고친 내용이 있어서 바꾼 옵션이 반영되지 않았어요.</span>
            <NoticeButton onClick={() => setEdited(null)} icon={<RotateCcw aria-hidden className="size-3.5" />}>
              되돌리기
            </NoticeButton>
          </Notice>
        )}
      </div>

      {isLoading ? (
        <div className="min-h-32 space-y-4 pt-2" aria-label="프롬프트를 만드는 중">
          <div className="h-5 w-11/12 animate-pulse rounded bg-secondary" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
          <p className="pt-1 text-sm text-faint">AI가 문장을 다듬고 있어요…</p>
        </div>
      ) : (
        <textarea
          id="prompt-output"
          value={prompt}
          onChange={(e) => {
            const text = e.target.value;
            setEdited((prev) => ({ text, base: prev?.base ?? generated }));
          }}
          spellCheck={false}
          className="field-sizing-content block max-h-[32rem] min-h-32 w-full resize-none bg-transparent text-lg leading-9 break-keep outline-none"
        />
      )}

      <fieldset className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-4">
        <legend className="sr-only">프롬프트에 덧붙일 내용</legend>
        <span aria-hidden className="mr-1 text-xs text-muted-foreground">
          덧붙이기
        </span>
        {(Object.keys(PROMPT_OPTION_LABELS) as (keyof PromptOptions)[]).map((key) => (
          <label
            key={key}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors select-none has-focus-visible:outline-2 has-focus-visible:outline-ring",
              options[key]
                ? "border-primary/50 bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={options[key]}
              onChange={(e) => setOptions((prev) => ({ ...prev, [key]: e.target.checked }))}
            />
            {options[key] && <Check aria-hidden className="size-3" />}
            {PROMPT_OPTION_LABELS[key]}
          </label>
        ))}
      </fieldset>
      <p className="mt-3 text-xs text-faint">문장은 AI(Google Gemini)가 다듬어요. 입력한 내용이 Google로 전송돼요.</p>
    </Panel>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-mark-1 px-3.5 py-2 text-sm">
      {children}
    </div>
  );
}

function NoticeButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
    >
      {icon}
      {children}
    </button>
  );
}
