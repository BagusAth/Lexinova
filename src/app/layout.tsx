import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { SwRegister } from "@/components/SwRegister";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Lexinova",
  description: "Belajar bahasa Inggris B1 setiap hari: fondasi, listening, reading, writing, speaking, dan conversation.",
  appleWebApp: { capable: true, title: "Lexinova", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#111326",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plex.variable} ${plexMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppShell>{children}</AppShell>
        <SwRegister />
      </body>
    </html>
  );
}
