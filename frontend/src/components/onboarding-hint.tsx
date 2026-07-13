"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Keyboard, Plus, Search, Sparkles, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { api } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";

/**
 * Onboarding hint shown to new users with zero orders.
 * Dismisses permanently once dismissed.
 */
export function OnboardingHint() {
  const router = useRouter();
  const { data: org } = useActiveOrganization();
  const slug = org?.slug;
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const key = `onboarding-dismissed-${slug}`;
    const stored = localStorage.getItem(key);
    if (stored === "true") {
      setDismissed(true);
      return;
    }
    setDismissed(false);

    // Check if there are any orders
    api.orders
      .list(slug, { limit: 1 })
      .then((res) => {
        if (res.total === 0) {
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (slug) {
      localStorage.setItem(`onboarding-dismissed-${slug}`, "true");
    }
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in">
      <Alert className="relative border-primary/20 bg-card shadow-lg">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-6" onClick={handleDismiss}>
          <X className="size-3" />
        </Button>
        <Sparkles className="size-4 text-primary" />
        <AlertTitle className="text-sm">Selamat datang di CekStatus!</AlertTitle>
        <AlertDescription className="space-y-3 pt-2">
          <p className="text-xs">Mulai dengan membuat pesanan pertama, atau jelajahi menu menggunakan shortcut:</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
              <span className="text-muted-foreground">Buka pencarian cepat</span>
            </div>
            <div className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>N</Kbd>
              </KbdGroup>
              <span className="text-muted-foreground">Buat pesanan baru</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => {
                router.push("/dashboard/orders/new");
                handleDismiss();
              }}
            >
              <Plus className="mr-1 size-3" />
              Buat Pesanan
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Tutup
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
