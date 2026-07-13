import type { ReactNode } from "react";

import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  description:
    "Masukkan kode tracking untuk cek status terbaru pesanan atau servis kamu. Pantau langsung dari CekStatus.",
  openGraph: {
    title: `Lacak Pesanan | ${APP_CONFIG.name}`,
    description: "Cek status terbaru pesanan atau servis kamu secara real-time. Masukkan kode tracking sekarang.",
    url: `${APP_CONFIG.url}/track`,
  },
};

export default function TrackLayout({ children }: { children: ReactNode }) {
  return children;
}
