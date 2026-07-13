"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { PackageSearch, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TrackPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Masukkan kode tracking");
      return;
    }
    setLoading(true);
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <PackageSearch className="size-7 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Lacak Pesanan</h1>
            <p className="text-sm text-muted-foreground">Masukkan kode tracking untuk cek status terbaru</p>
          </div>
        </div>

        {/* Search Card */}
        <Card className="shadow-sm">
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="Contoh: TRK-202607-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 text-center text-base tracking-wider"
                autoFocus
                autoComplete="off"
              />
              <Button type="submit" size="lg" className="gap-2" disabled={loading}>
                <Search className="size-5" />
                {loading ? "Mencari..." : "Cek Status"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Dapatkan kode tracking dari toko tempat kamu melakukan servis atau pembelian
        </p>
      </div>
    </div>
  );
}
