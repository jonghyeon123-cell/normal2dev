// /api/search 요청·응답 형식. 화면과 서버가 함께 사용한다.

export type Term = {
  id: string;
  term: string;
  term_en: string;
  category: string;
  subcategory: string;
  definition: string;
  analogy: string;
  /** 구체적인 상황이 담긴 요청 예문. 용어 사전에서 예시로 보여준다 */
  prompt_phrase: string;
  /** 어떤 상황에도 맞는 구현 체크포인트. 프롬프트 조립에 쓴다 */
  prompt_points: string[];
  related: string[];
  confusable: string | null;
};

export type MatchKind = "term" | "alias" | "definition";

export type SearchResult = {
  term: Term;
  /** 0~1. rankedBy 가 rerank 면 rerank 점수, vector 면 코사인 유사도 */
  score: number;
  /** 벡터 검색에서 가장 가까웠던 사전 문장 */
  matchedBy: { kind: MatchKind; content: string };
};

/**
 * matched: 1위 점수가 확신 기준 이상 → 바로 추천
 * uncertain: 후보 기준 이상 → "혹시 이 중에 있나요?"
 * not_found: 그 미만 → 더 자세히 설명해 달라고 안내
 */
export type ChunkStatus = "matched" | "uncertain" | "not_found";

export type ChunkResult = {
  text: string;
  status: ChunkStatus;
  /** rerank 가 실패하면 벡터 유사도 순서로 대신 응답한다 */
  rankedBy: "rerank" | "vector";
  results: SearchResult[];
};

export type SearchResponse = {
  query: string;
  chunks: ChunkResult[];
};

export type ApiError = {
  error: { code: string; message: string };
};
