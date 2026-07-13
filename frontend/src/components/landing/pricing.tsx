"use client";

import { CircleCheck, Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Pricing = () => {
  return (
    <div id="pricing" className="flex flex-col items-center justify-center py-12 xs:py-20 px-6">
      <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-center tracking-tight">Harga</h1>
      <p className="mt-3 xs:text-lg text-center text-muted-foreground max-w-xl">
        Saat ini CekStatus gratis selamanya untuk 1 bisnis. Nikmati semua fitur tanpa biaya bulanan.
      </p>
      <div className="mt-12 max-w-md mx-auto w-full">
        className="relative border-2 border-primary rounded-xl p-6 bg-background"
        <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground">
          Gratis Selamanya
        </Badge>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-medium">Pemula</h3>
        </div>
        <p className="mt-2">
          <span className="text-4xl font-bold">Gratis</span>
          <span className="ml-1.5 text-sm text-muted-foreground font-normal">/selamanya</span>
        </p>
        <p className="mt-4 font-medium text-muted-foreground">
          Cocok untuk UMKM yang baru memulai. Semua fitur dasar sudah termasuk.
        </p>
        <Button size="lg" className="w-full mt-6 text-base rounded-full">
          Mulai Sekarang
        </Button>
        <Separator className="my-8" />
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <CircleCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
            <span>1 bisnis / organisasi</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
            <span>Pelanggan & pesanan tak terbatas</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
            <span>Halaman tracking publik white-label</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
            <span>Alur status kustom</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
            <span>Lampiran foto</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
            <span>Laporan & analytics dasar</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Pricing;
