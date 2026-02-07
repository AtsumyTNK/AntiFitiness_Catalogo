import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * ============================================================
 * Fontes (Next Font)
 * ============================================================
 * - `variable` expõe a fonte como CSS variable para uso no Tailwind/CSS.
 * - `subsets` mantém o bundle menor.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * ============================================================
 * Metadata global
 * ============================================================
 * Ajustado para o seu projeto:
 * - title/description não ficam como "Create Next App"
 * - melhora SEO básico e consistência
 *
 * Observação:
 * - Se você quiser títulos dinâmicos por página, dá para usar `title.template`.
 */
export const metadata: Metadata = {
  title: "AntiFitness | Catálogo",
  description: "Catálogo AntiFitness. Monte seu pedido e verifique disponibilidade no WhatsApp.",
  applicationName: "AntiFitness",
  metadataBase: new URL("https://example.com"), // Troque pelo seu domínio quando tiver
};

/**
 * ============================================================
 * Root Layout
 * ============================================================
 * - Define `lang` para pt-BR (seu público é Brasil)
 * - Define estilos base no body para manter o site consistente
 * - `min-h-screen` garante altura mínima e evita “páginas baixas” em mobile
 * - `bg-neutral-950 text-white` combina com o design que você já adotou
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "antialiased",
          "min-h-screen",
          "bg-neutral-950",
          "text-white",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}