import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "FRODEV.APP",
  description: "Gestor personal — finanzas y gym",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${spaceMono.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-6 pb-28">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
