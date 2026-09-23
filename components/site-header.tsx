"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "번역기" },
  { href: "/terms", label: "용어 사전" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        {/* 로고 자체가 번역: 한글 글꼴의 Normal → 코드 글꼴의 Dev */}
        <Link href="/" className="flex items-baseline text-[17px] font-semibold tracking-tight">
          Normal
          <span aria-hidden className="mx-px text-faint">
            2
          </span>
          <span className="font-mono font-medium text-primary">Dev</span>
          <span className="sr-only"> 홈</span>
        </Link>

        {/* 번역 앱의 언어 전환처럼 생긴 메뉴 */}
        <nav aria-label="주요 메뉴" className="ml-auto flex rounded-full bg-secondary p-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-card font-semibold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
