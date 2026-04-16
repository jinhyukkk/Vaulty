"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBin6Line } from "@remixicon/react";

import { Button } from "@/components/ui/Button";

export function DeleteButton({
  url,
  label = "삭제",
  confirmMessage = "정말 삭제하시겠습니까?",
}: {
  url: string;
  label?: string;
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        window.alert(j.error ?? "삭제 실패");
        return;
      }
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
    >
      <RiDeleteBin6Line className="size-4 text-red-600 dark:text-red-400" />
    </Button>
  );
}
