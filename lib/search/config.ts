// 검색 설정. scripts/*.mjs 에서도 import 하므로 다른 모듈을 import 하지 않는다.

// 인덱싱과 검색은 반드시 같은 모델을 써야 한다. 바꾸면 npm run index-terms 로 전부 다시 임베딩해야 한다.
export const EMBEDDING_MODEL = "voyage-3.5";
export const EMBEDDING_DIM = 1024;
export const RERANK_MODEL = "rerank-2.5";

// 벡터 검색으로 후보를 넓게 뽑은 뒤 rerank 로 다시 순위를 매긴다.
export const RERANK_CANDIDATES = 15;
export const RESULTS_PER_CHUNK = 3;

// rerank 점수 기준. 실험 결과: 정답 0.74~0.92, 관련 없는 입력 0.34~0.50
export const CONFIDENT_RERANK_SCORE = 0.7;
export const CANDIDATE_RERANK_SCORE = 0.55;

// rerank 가 실패했을 때 쓰는 벡터 유사도 기준. 실험 결과: 정답 0.61~0.73, 사전에 없는 표현 0.43 전후
export const CONFIDENT_SIMILARITY = 0.6;
export const CANDIDATE_SIMILARITY = 0.5;

export const MAX_QUERY_LENGTH = 300;
export const MAX_CHUNKS = 5;
