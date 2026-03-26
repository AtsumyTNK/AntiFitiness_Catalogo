import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AntiFitness | Catálogo",
  description: "Catálogo AntiFitness. Monte seu pedido e verifique disponibilidade no WhatsApp.",
  applicationName: "AntiFitness",
  metadataBase: new URL("https://example.com"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-neutral-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
