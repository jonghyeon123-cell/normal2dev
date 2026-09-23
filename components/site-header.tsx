"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/", icon: "🔍", label: "번역기" },
  { href: "/terms", icon: "📖", label: "용어 사전" },
  { href: "/saved", icon: "⭐", label: "내 단어장" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-11 items-center gap-1 px-2 sm:px-4">
        <Link
          href="/"
          className="mr-1 flex items-center rounded-md px-1.5 py-1 text-[15px] font-semibold tracking-tight transition-colors hover:bg-hover sm:mr-3"
        >
          Normal<span className="mx-px font-mono text-primary">2</span>Dev
        </Link>

        <nav aria-label="주요 메뉴" className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-hover",
                isActive(item.href) ? "bg-hover font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <span aria-hidden className="hidden text-[13px] sm:inline">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
