export type Tint = "gray" | "orange" | "yellow" | "green" | "blue" | "purple" | "red";

// Tailwind 가 클래스를 찾을 수 있도록 전체 이름을 적어 둔다.
export const TINT_BG: Record<Tint, string> = {
  gray: "bg-tint-gray",
  orange: "bg-tint-orange",
  yellow: "bg-tint-yellow",
  green: "bg-tint-green",
  blue: "bg-tint-blue",
  purple: "bg-tint-purple",
  red: "bg-tint-red",
};
