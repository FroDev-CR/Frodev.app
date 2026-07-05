import type { Metadata, Viewport } from "next";
import { Space_Mono, Caveat } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import WalletHud from "@/components/WalletHud";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Fuente manuscrita para la lista de compras estilo cuaderno.
const caveat = Caveat({
  variable: "--font-caveat",
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
    <html
      lang="es"
      className={`${spaceMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        <WalletHud />
        <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-16 pb-28">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
