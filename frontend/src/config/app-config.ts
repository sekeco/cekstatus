import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cekstatus.id";

export const APP_CONFIG = {
  name: "CekStatus",
  tagline: "Platform Tracking Pesanan & Servis #1 untuk UMKM Indonesia",
  version: packageJson.version,
  copyright: `© ${currentYear}, CekStatus.`,
  url: APP_URL,
  meta: {
    title: "CekStatus - Lacak Status Pesanan & Servis UMKM",
    titleTemplate: "%s | CekStatus",
    description:
      "Platform tracking pesanan & servis untuk bisnis Kamu. Lacak status pesanan real-time, gratis selamanya.",
    keywords: [
      "tracking pesanan",
      "status servis",
      "aplikasi UMKM",
      "manajemen pesanan",
      "tracking servis laptop",
      "bengkel",
      "laundry",
      "aplikasi kasir",
      "cek status pesanan",
      "software UMKM Indonesia",
      "aplikasi bengkel gratis",
      "manajemen servis",
      "order tracking",
      "lacak pesanan online",
      "sistem informasi bengkel",
    ],
    ogImage: "/og-image.png",
    locale: "id_ID",
    siteName: "CekStatus",
    twitterHandle: "@cekstatus",
  },
};
