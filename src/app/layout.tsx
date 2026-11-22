import type { Metadata, Viewport } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";
import { SwRegister } from "@/components/SwRegister";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "700"],
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
    <html lang="id" className={`${nunito.variable} ${space.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="starfield" aria-hidden="true">
          <i className="s1" />
          <i className="s2" />
          <i className="s3" />
        </div>
        <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
        <SwRegister />
      </body>
    </html>
  );
}
