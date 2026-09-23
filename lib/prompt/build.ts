import type { ChunkResult, Term } from "@/lib/search/types";

// 조각별 문장은 AI(Gemini)가 만들고, AI 를 쓸 수 없을 때는 아래 템플릿으로 만든다.
// 번호, 세부 요구사항, 덧붙이기 문장은 AI 없이 여기서 조립한다.
export type PromptOptions = {
  /** 용어별 구현 체크포인트를 넣는다 */
  details: boolean;
  /** 요청한 부분만 수정하게 한다 (작업 범위) */
  scopeOnly: boolean;
  /** 코드 전에 계획을 먼저 보여 달라고 한다 (단계적 진행) */
  planFirst: boolean;
  /** 입문자용 설명과 한국어 주석을 요청한다 */
  explainForBeginner: boolean;
};

export const DEFAULT_PROMPT_OPTIONS: PromptOptions = {
  details: false,
  scopeOnly: false,
  planFirst: false,
  explainForBeginner: false,
};

export const PROMPT_OPTION_LABELS: Record<keyof PromptOptions, string> = {
  details: "세부 요구사항",
  scopeOnly: "요청한 부분만 수정",
  planFirst: "계획 먼저 보여주기",
  explainForBeginner: "입문자용 설명",
};

const EXTRA_LINES: Partial<Record<keyof PromptOptions, string>> = {
  scopeOnly: "요청한 기능과 관련된 파일만 수정하고, 다른 기능이나 파일은 건드리지 말아 주세요.",
  planFirst: "코드를 작성하기 전에 어떻게 구현할지 계획을 먼저 보여 주세요.",
  explainForBeginner: "무엇을 왜 바꿨는지 입문자도 이해할 수 있게 설명하고, 코드에 한국어 주석을 달아 주세요.",
};

// "스티키 (따라다니는 고정)" → "스티키", "File Upload / Dropzone" → "File Upload"
const shortName = (s: string) => s.split(/\s+\(|\s*\//)[0].trim();

/** "모달(Modal)" */
export function termLabel(term: Pick<Term, "term" | "term_en">) {
  const en = shortName(term.term_en);
  const ko = shortName(term.term);
  return ko === en ? ko : `${ko}(${en})`;
}

// 한글 마지막 글자의 받침에 따라 "로/으로"를 고른다. 받침이 없거나 ㄹ 받침이면 "로".
function roParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return "로";
  const jong = code % 28;
  return jong === 0 || jong === 8 ? "로" : "으로";
}

/**
 * 조각마다 고른 용어. 못 찾은 조각은 null.
 * selection: 조각 순서 → 고른 용어 id
 */
export function pickedTerms(chunks: ChunkResult[], selection: Record<number, string>): (Term | null)[] {
  return chunks.map(
    (chunk, i) => (chunk.results.find((r) => r.term.id === selection[i]) ?? chunk.results[0])?.term ?? null,
  );
}

/**
 * AI 를 쓸 수 없을 때의 조각별 문장.
 * "휴대폰에서도 안 깨지게 해줘" → "반응형 웹(Responsive Web Design)으로 구현해 주세요."
 * 맞는 용어를 못 찾은 조각은 번역기처럼 원래 문장을 그대로 둔다.
 */
export function templateItems(chunks: ChunkResult[], terms: (Term | null)[]): string[] {
  return chunks.map((chunk, i) => {
    const term = terms[i];
    return term ? `${termLabel(term)}${roParticle(shortName(term.term))} 구현해 주세요.` : chunk.text;
  });
}

/**
 * 조각별 문장을 하나의 프롬프트로 합친다.
 * 문장이 여러 개면 번호를 붙이고, 세부 요구사항을 켜면 용어별 체크포인트를 각 문장 아래에 넣고,
 * 나머지 덧붙이기 옵션은 맨 끝에 붙인다.
 */
export function composePrompt(items: string[], terms: (Term | null)[], options: PromptOptions): string {
  const numbered = items.length > 1;
  const blocks = items.map((item, i) => {
    const head = numbered ? `${i + 1}. ${item}` : item;
    const points = options.details ? (terms[i]?.prompt_points ?? []) : [];
    return [head, ...points.map((p) => `${numbered ? "   " : ""}- ${p}`)].join("\n");
  });
  // 세부 요구사항이 있으면 항목마다 빈 줄로 나눠 읽기 쉽게 한다.
  const body = blocks.join(options.details ? "\n\n" : "\n");

  const extras = (Object.keys(EXTRA_LINES) as (keyof PromptOptions)[])
    .filter((key) => options[key])
    .map((key) => EXTRA_LINES[key]!);
  return extras.length ? `${body}\n\n${extras.join("\n")}` : body;
}
