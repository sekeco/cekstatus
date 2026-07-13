import type { ReactNode } from "react";

import type { Metadata } from "next";

import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { fontVars } from "@/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

const { meta } = APP_CONFIG;

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: {
    default: meta.title,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: meta.description,
  keywords: meta.keywords,
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  publisher: APP_CONFIG.name,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: meta.locale,
    siteName: meta.siteName,
    title: meta.title,
    description: meta.description,
    url: APP_CONFIG.url,
    images: [
      {
        url: meta.ogImage,
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.description,
    images: [meta.ogImage],
    site: meta.twitterHandle,
    creator: meta.twitterHandle,
  },

  category: "technology",

  icons: {
    icon: "/favicon.ico",
    // Generate these later if needed:
    // apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",

  // Verification for Google Search Console etc.
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_CODE",
  // },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_CONFIG.url}/#website`,
      url: APP_CONFIG.url,
      name: APP_CONFIG.name,
      alternateName: "CekStatus",
      description: meta.description,
      inLanguage: "id",
      publisher: {
        "@id": `${APP_CONFIG.url}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${APP_CONFIG.url}/#organization`,
      name: APP_CONFIG.name,
      alternateName: "CekStatus",
      url: APP_CONFIG.url,
      description: meta.description,
      slogan: APP_CONFIG.tagline,
      foundingLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Indonesia" } },
      // logo: { "@type": "ImageObject", url: `${APP_CONFIG.url}/logo.png` },
      // image: { "@type": "ImageObject", url: `${APP_CONFIG.url}/og-image.png` },
      sameAs: [
        // "https://twitter.com/cekstatus",
        // "https://instagram.com/cekstatus",
        // "https://facebook.com/cekstatus",
      ],
    },
    {
      "@type": "WebApplication",
      "@id": `${APP_CONFIG.url}/#webapplication`,
      name: APP_CONFIG.name,
      alternateName: "CekStatus",
      description: meta.description,
      url: APP_CONFIG.url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IDR",
        description: "Gratis selamanya untuk 1 bisnis",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;
  return (
    <html
      lang="id"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
