import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { LucideProvider } from "lucide-react";
import { siteConfig } from "@/config/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

/** Tela cheia no celular, sem zoom do navegador competindo com o zoom do mapa. */
export const viewport: Viewport = {
  themeColor: "#0747de",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden font-sans">
        {/* Traço mais fino que o padrão do Lucide (2), como no design. */}
        <LucideProvider strokeWidth={1.5}>{children}</LucideProvider>
      </body>
    </html>
  );
}
