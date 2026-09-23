"use client";

import { Check, Copy, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/n2d/parts";
import { Button } from "@/components/ui/button";
import { buildPrompt, DEFAULT_PROMPT_OPTIONS, PROMPT_OPTION_LABELS, type PromptOptions } from "@/lib/prompt/build";
import type { ChunkResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

/** 번역 결과인 프롬프트. 직접 고치고 복사할 수 있다 */
export function PromptPanel({ chunks, selection }: { chunks: ChunkResult[]; selection: Record<number, string> }) {
  const [options, setOptions] = useState<PromptOptions>(DEFAULT_PROMPT_OPTIONS);
  // 사용자가 직접 고친 내용과, 고치기 시작할 때의 자동 프롬프트. null 이면 자동 프롬프트를 보여준다.
  const [edited, setEdited] = useState<{ text: string; base: string } | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const generated = useMemo(() => buildPrompt(chunks, selection, options), [chunks, selection, options]);
  const prompt = edited?.text ?? generated;
  // 고친 뒤에 용어나 옵션을 바꿔서 자동 프롬프트가 달라졌을 때만 알려준다.
  const isOutdated = edited !== null && edited.base !== generated;

  useEffect(() => () => clearTimeout(resetTimer.current), []);

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
        <Button size="sm" className="rounded-full px-3" onClick={copy} aria-live="polite">
          {copyState === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사하지 못했어요" : "복사"}
        </Button>
      }
    >
      {isOutdated && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-mark-1 px-3.5 py-2 text-sm">
          <span>직접 고친 내용이 있어서 바꾼 용어가 반영되지 않았어요.</span>
          <button
            type="button"
            onClick={() => setEdited(null)}
            className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            다시 만들기
          </button>
        </div>
      )}

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
    </Panel>
  );
}
