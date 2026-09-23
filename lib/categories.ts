import type { Tint } from "@/components/doc/tint";

// 용어 분야별 이름과 색. 태그와 필터에서 같은 색을 쓴다.
export const CATEGORIES: Record<string, { label: string; tint: Tint }> = {
  FE: { label: "프론트엔드", tint: "blue" },
  BE: { label: "백엔드", tint: "purple" },
  DB: { label: "데이터베이스", tint: "green" },
  배포: { label: "배포", tint: "orange" },
  공통: { label: "공통", tint: "gray" },
};

export function categoryOf(category: string) {
  return CATEGORIES[category] ?? { label: category, tint: "gray" as const };
}
