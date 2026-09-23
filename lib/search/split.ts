import { MAX_CHUNKS } from "./config";

const MIN_CHUNK_LENGTH = 5; // 공백 제외 글자 수. 이보다 짧은 조각은 옆 조각에 붙인다.

// 문장 부호와 접속 표현 기준으로 나눈다.
const HARD_BREAK = /[,.!?;\n，。]+|\s(?:그리고 나서|그리고|그 다음에?|그다음에?|또한|또|및)\s/;
// "~고 / ~며 / ~면서 / ~는데 / ~지만" 으로 끝나는 어절 뒤에서 나눈다. 앞 조각이 어미를 갖도록 뒤쪽 공백에서 자른다.
const SOFT_BREAK = /(?<=[가-힣](?:고|며|면서|는데|지만))\s+/;

const visibleLength = (s: string) => s.replace(/\s/g, "").length;

/**
 * 한 문장에 여러 요청이 섞여 있으면 의미 단위로 나눈다.
 * "버튼 누르면 작은 창 뜨고, 저장되면 알려줘" → ["버튼 누르면 작은 창 뜨고", "저장되면 알려줘"]
 */
export function splitPhrases(input: string): string[] {
  const pieces = input
    .split(HARD_BREAK)
    .flatMap((part) => (part ?? "").split(SOFT_BREAK))
    .map((p) => p.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const piece of pieces) {
    const last = merged.at(-1);
    if (last !== undefined && (visibleLength(piece) < MIN_CHUNK_LENGTH || visibleLength(last) < MIN_CHUNK_LENGTH)) {
      merged[merged.length - 1] = `${last} ${piece}`;
    } else {
      merged.push(piece);
    }
  }

  // 조각이 너무 많으면 뒤쪽을 마지막 조각에 합친다.
  if (merged.length > MAX_CHUNKS) {
    const tail = merged.splice(MAX_CHUNKS - 1).join(" ");
    merged.push(tail);
  }
  return merged;
}
