import Link from "next/link";

import { Frown } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Frown />
        </EmptyMedia>
        <EmptyTitle>Halaman tidak ditemukan</EmptyTitle>
        <EmptyDescription>Halaman yang kamu cari tidak tersedia atau telah dipindahkan.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link prefetch={false} replace href="/dashboard/default">
            Kembali ke Beranda
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
