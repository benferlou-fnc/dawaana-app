import type { Metadata, Viewport } from "next";
import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PwaRegister from "@/components/PwaRegister";
import MobileTabBar from "@/components/MobileTabBar";
import { getLocale, dirOf } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  title: "Dawaana — Solidarité médicaments",
  description:
    "Plateforme associative qui met en relation, gratuitement et sans transaction financière, les personnes qui cherchent un médicament rare et celles qui peuvent en donner un.",
  manifest: "/manifest.webmanifest",
  applicationName: "Dawaana",
  appleWebApp: {
    capable: true,
    title: "Dawaana",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F0653E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const dir = dirOf(locale);

  return (
    <html lang={locale} dir={dir}>
      <body
        className={
          locale === "ar"
            ? "font-arabic bg-brand-bg text-brand-ink antialiased"
            : "font-body bg-brand-bg text-brand-ink antialiased"
        }
      >
        <Nav locale={locale} />
        {/* Marge basse sur mobile pour que la barre d'onglets ne recouvre rien. */}
        <main className="pb-20 md:pb-0">{children}</main>
        <Footer locale={locale} />
        <MobileTabBar locale={locale} />
        <PwaRegister />
      </body>
    </html>
  );
}
