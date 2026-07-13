"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Building2, LogOut, PlusIcon } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { authClient, useListOrganizations } from "@/lib/auth-client";

export default function SelectOrganizationPage() {
  const { data: orgs, isPending: orgsLoading } = useListOrganizations();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const handleSelect = async (orgId: string) => {
    setActivating(orgId);
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      });
      window.location.assign("/dashboard/default");
    } catch (err) {
      console.error("Gagal mengatur organisasi aktif", err);
    } finally {
      setActivating(null);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo className="size-8 fill-primary" />
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Pilih Bisnis</h1>
            <p className="text-sm text-muted-foreground">
              {user ? (
                <>
                  Halo, <span className="font-medium text-foreground">{user.name}</span>. Pilih bisnis yang ingin kamu
                  kelola.
                </>
              ) : (
                <>Pilih bisnis yang ingin kamu kelola.</>
              )}
            </p>
          </div>
        </div>

        {/* Content Card */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-3">
            {orgsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex h-16 animate-pulse items-center gap-3 rounded-lg border bg-muted/50 p-4">
                    <div className="size-10 rounded-lg bg-muted" />
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orgs && orgs.length > 0 ? (
              <>
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelect(org.id)}
                    disabled={activating === org.id}
                    className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-xs transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium">{org.name}</span>
                      {org.metadata &&
                        typeof org.metadata === "object" &&
                        "businessType" in (org.metadata as object) && (
                          <span className="text-xs text-muted-foreground">
                            {(org.metadata as { businessType?: string }).businessType}
                          </span>
                        )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {activating === org.id ? "Membuka..." : "Pilih →"}
                    </span>
                  </button>
                ))}

                <Link href="/org/create" className="mt-1">
                  <Button variant="default" className="w-full gap-2">
                    <PlusIcon className="size-4" />
                    Buat Bisnis Baru
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Kamu belum punya bisnis</EmptyTitle>
                    <EmptyDescription>Buat bisnis pertama kamu untuk memulai.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
                <Link href="/org/create">
                  <Button variant="default" className="w-full gap-2">
                    <PlusIcon className="size-4" />
                    Buat Bisnis Baru
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            <LogOut className="size-3" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
