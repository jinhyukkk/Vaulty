"use client";

import { useEffect, useState } from "react";
import { RefreshButton } from "./RefreshButton";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  const [clock, setClock] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    setClock(fmt());
    const t = setInterval(() => setClock(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex h-14 items-center gap-5 border-b border-vaulty-line bg-vaulty-surface px-6">
      <div>
        <div className="font-serif text-[18px] font-medium tracking-[-0.3px] text-vaulty-ink">
          {title}
        </div>
        <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
          {subtitle ?? title.toUpperCase()}
        </div>
      </div>
      <div className="flex-1" />
      <div className="hidden items-center gap-2 rounded-vault border border-vaulty-line bg-vaulty-surfaceAlt px-3 py-1.5 md:flex md:w-[280px]">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8B8270"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input
          placeholder="종목, 티커 검색…"
          className="flex-1 border-none bg-transparent text-xs text-vaulty-ink outline-none placeholder:text-vaulty-inkMuted"
        />
        <span className="border border-vaulty-line bg-vaulty-surface px-1.5 py-[1px] font-mono text-[9px] text-vaulty-inkMuted">
          ⌘K
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono text-[11px] text-vaulty-inkMuted">
        <span className="h-1.5 w-1.5 rounded-full bg-vaulty-up shadow-[0_0_0_3px_rgba(47,107,79,0.15)]" />
        LIVE · {clock || "--:--"} KST
      </div>
      <RefreshButton />
    </header>
  );
}
