// /api/prompt 요청·응답 형식. 화면과 서버가 함께 사용한다.

export const MAX_PROMPT_CHUNKS = 5;

export type PromptRequest = {
  /** 사용자가 적은 원래 문장 */
  query: string;
  /** 문장 조각과 그 조각에 고른 용어 id (못 찾았으면 null) */
  chunks: { text: string; termId: string | null }[];
};

/** 조각 순서대로 번역한 문장. 개수는 조각 수와 같다 */
export type PromptResponse = { items: string[] };
