import Link from "next/link";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function UnauthorizedPage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>Akses Ditolak</EmptyTitle>
        <EmptyDescription>
          Kamu tidak memiliki izin untuk mengakses halaman ini. Hubungi admin jika menurutmu ini adalah kesalahan.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/dashboard/default" prefetch={false}>
            Ke Beranda
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
