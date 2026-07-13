"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Global keyboard shortcuts provider.
 * Mount once in the dashboard layout.
 */
export function KeyboardShortcuts() {
  const router = useRouter();

  useKeyboardShortcuts([
    {
      key: "n",
      meta: true,
      handler: () => {
        toast("Membuat pesanan baru...", { id: "new-order-shortcut" });
        router.push("/dashboard/orders/new");
      },
    },
  ]);

  return null;
}
