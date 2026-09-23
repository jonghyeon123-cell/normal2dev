"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// 아이콘은 CSS(dark:)로 바꿔서, 서버 렌더링 결과와 테마가 달라도 깜빡임이 없다.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <span className="sr-only">밝은 화면과 어두운 화면 전환</span>
    </button>
  );
}
