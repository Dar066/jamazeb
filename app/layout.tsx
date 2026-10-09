import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CatalogProvider } from "@/components/CatalogProvider";
import { ChatWidget } from "@/components/ChatWidget";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreOnly } from "@/components/StoreOnly";
import { getCatalog } from "@/lib/catalog-source";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted variable fonts: no request to Google at runtime.
const jost = localFont({
  src: "./fonts/jost.woff2",
  variable: "--font-jost",
  display: "swap",
  weight: "100 900",
});

const cormorant = localFont({
  src: "./fonts/cormorant-garamond.woff2",
  variable: "--font-cormorant",
  display: "swap",
  weight: "300 700",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Lawn, Unstitched & Ready-to-Wear Clothing in Pakistan`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  // Canonical URLs are set per page, never here, so pages don't all point at the home page.
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_PK",
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog();
  return (
    <html lang="en" className={`${jost.variable} ${cormorant.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <CatalogProvider products={catalog}>
          <StoreOnly>
            <AnnouncementBar />
            <Header />
          </StoreOnly>
          <main id="main">{children}</main>
          <StoreOnly>
            <Footer />
            <ChatWidget />
          </StoreOnly>
        </CatalogProvider>
      </body>
    </html>
  );
}
