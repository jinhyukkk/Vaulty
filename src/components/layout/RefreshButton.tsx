"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiRefreshLine } from "@remixicon/react";

import { Button } from "@/components/ui/Button";

export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      await fetch("/api/prices/refresh", { method: "POST" }).catch(() => null);
      router.refresh();
    });
  };

  return (
    <Button size="sm" onClick={onClick} disabled={pending}>
      <RiRefreshLine
        className={`mr-1 size-4 ${pending ? "animate-spin" : ""}`}
      />
      {pending ? "갱신 중..." : "시세 갱신"}
    </Button>
  );
}
