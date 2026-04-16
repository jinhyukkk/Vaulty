"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiBriefcase4Line,
  RiExchangeDollarLine,
  RiLineChartLine,
  RiScales3Line,
  RiSettings3Line,
} from "@remixicon/react";
import { cx, focusRing } from "@/lib/utils";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigation: NavItem[] = [
  { name: "대시보드", href: "/", icon: RiDashboardLine },
  { name: "보유 현황", href: "/holdings", icon: RiBriefcase4Line },
  { name: "거래 내역", href: "/transactions", icon: RiExchangeDollarLine },
  { name: "성과 분석", href: "/analytics", icon: RiLineChartLine },
  { name: "리밸런싱", href: "/rebalance", icon: RiScales3Line },
  { name: "설정", href: "/settings", icon: RiSettings3Line },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:block">
      <div className="flex h-16 items-center px-6 text-lg font-semibold text-gray-900 dark:text-gray-50">
        Vaultly
      </div>
      <nav className="px-3 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cx(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900",
                    focusRing,
                  )}
                >
                  <Icon className="size-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
