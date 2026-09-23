// 용어 분야별 이름과 글자색. 사전의 품사 표시처럼 쓴다.
export const CATEGORIES: Record<string, { label: string; ink: string }> = {
  FE: { label: "프론트엔드", ink: "text-cat-fe" },
  BE: { label: "백엔드", ink: "text-cat-be" },
  DB: { label: "데이터베이스", ink: "text-cat-db" },
  배포: { label: "배포", ink: "text-cat-deploy" },
  공통: { label: "공통", ink: "text-cat-common" },
};

export function categoryOf(category: string) {
  return CATEGORIES[category] ?? { label: category, ink: "text-cat-common" };
}
