"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  path: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "대시", path: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { href: "/holdings", label: "자산", path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { href: "/transactions", label: "관리", path: "M3 12l4-4 4 4 6-6 4 4" },
  { href: "/analytics", label: "분석", path: "M3 21V7M9 21V3M15 21v-8M21 21V11" },
  { href: "/rebalance", label: "리밸", path: "M3 12h6l3-9 4 18 3-9h2" },
  { href: "/settings", label: "설정", path: "M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[68px] shrink-0 flex-col items-center gap-1.5 border-r border-vaulty-line bg-vaulty-surface py-4 md:flex">
      <div className="mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-vault bg-vaulty-accent font-serif text-[18px] font-semibold text-vaulty-surface">
        V
      </div>
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`group flex h-[52px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-vault transition-colors ${
              active
                ? "bg-vaulty-accentSoft text-vaulty-accent"
                : "text-vaulty-inkMuted hover:bg-vaulty-surfaceAlt"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={item.path} />
            </svg>
            <span className="font-mono text-[8px] tracking-[0.5px]">
              {item.label}
            </span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-vaulty-bronzeSoft font-serif text-[13px] font-semibold text-vaulty-bronze">
        JK
      </div>
    </aside>
  );
}
