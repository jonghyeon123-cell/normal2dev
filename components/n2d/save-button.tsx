"use client";

import { Star } from "lucide-react";
import { useSavedTerms } from "@/lib/saved-terms";
import { cn } from "@/lib/utils";

export function SaveButton({ termId, termName, className }: { termId: string; termName: string; className?: string }) {
  const { isSaved, toggle } = useSavedTerms();
  const saved = isSaved(termId);

  return (
    <button
      type="button"
      onClick={() => toggle(termId)}
      aria-pressed={saved}
      aria-label={saved ? `${termName} 저장 취소` : `${termName} 저장`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
        saved
          ? "border-mark-1 bg-mark-1 text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Star aria-hidden className={cn("size-3.5", saved && "fill-current")} />
      {saved ? "저장됨" : "저장"}
    </button>
  );
}
