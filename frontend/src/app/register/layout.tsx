import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Gratis",
  description:
    "Daftar akun CekStatus gratis. Kelola pesanan dan tracking servis UMKM tanpa ribet. Tidak perlu kartu kredit.",
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
