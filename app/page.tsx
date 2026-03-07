"use client";

import { CartItem, getCart } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const WHATS_NUMBER = "5517981229285";
const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

/**
 * Monta a URL do WhatsApp com a mensagem pronta.
 */
function buildWhatsUrl(message: string) {
  return `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Compatibilidade com formatos antigos e novos do carrinho.
 */
type LegacyCartFields = Partial<{
  productName: string;
  variantLabel: string;
  quantity: number;
}>;

type NewCartFields = Partial<{
  name: string;
  variantLabel: string;
  qty: number;
}>;

type CartItemCompat = CartItem & LegacyCartFields & NewCartFields;

function asCompat(i: CartItem): CartItemCompat {
  return i as CartItemCompat;
}

/**
 * Retorna a quantidade de forma segura.
 */
function getQty(i: CartItem): number {
  const c = asCompat(i);
  const raw = c.qty ?? c.quantity ?? 0;
  const n = Number(raw);

  if (!Number.isFinite(n)) return 0;

  return Math.max(0, Math.floor(n));
}

/**
 * Retorna o nome do produto de forma segura.
 */
function getName(i: CartItem): string {
  const c = asCompat(i);
  return String(c.name ?? c.productName ?? "Produto");
}

/**
 * Retorna a variação de forma segura.
 */
function getVariantLabel(i: CartItem): string {
  const c = asCompat(i);
  return String(c.variantLabel ?? "Padrão");
}

export default function HomePage() {
  /**
   * Lê o carrinho no client sem depender de useEffect.
   */
  const [items] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getCart();
  });

  /**
   * Soma a quantidade total de itens do carrinho.
   */
  const totalItems = useMemo(() => items.reduce((acc, i) => acc + getQty(i), 0), [items]);

  /**
   * Monta a mensagem que será enviada para o WhatsApp.
   */
  function buildMessageFromCart() {
    const current = getCart();
    const total = current.reduce((acc, i) => acc + getQty(i), 0);
    const lines = current.map((i) => `- ${getQty(i)}x ${getName(i)} — ${getVariantLabel(i)}`);

    return [
      "Lista – Catálogo AntiFitness",
      "",
      "Itens:",
      ...lines,
      "",
      `Total de itens: ${total}`,
      "",
      WHATS_AVAILABILITY_NOTE,
    ].join("\n");
  }

  /**
   * Abre o WhatsApp com a lista pronta.
   */
  function openWhatsAppWithCart() {
    const current = getCart();

    if (current.length === 0) {
      alert("Seu carrinho está vazio. Adicione produtos antes de enviar no WhatsApp.");
      return;
    }

    window.location.href = buildWhatsUrl(buildMessageFromCart());
  }

  const whatsappDirect = `https://wa.me/${WHATS_NUMBER}`;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Fundo decorativo */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[90px]" />
        <div className="absolute -bottom-40 right-0 h-130 w-130 rounded-full bg-sky-500/10 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Bloco da marca */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image
                src="/logo.svg"
                alt="Logo AntiFitness"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>

            <div className="leading-tight">
              <p className="text-sm text-white/70">Catálogo</p>
              <h1 className="text-base font-semibold tracking-tight">AntiFitness</h1>
            </div>
          </div>

          {/* Navegação principal */}
          <div className="flex items-center gap-2">
            <Link
              href="/catalogo"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
            >
              Ver catálogo
            </Link>

            <Link
              href="/carrinho"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90"
            >
              Carrinho (<span suppressHydrationWarning>{totalItems}</span>)
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo principal da home */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/10">
              {WHATS_AVAILABILITY_NOTE}
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Um catálogo <span className="text-emerald-300">limpo</span>,{" "}
              <span className="text-emerald-300">rápido</span> e pronto pra vender.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              Escolha os itens, selecione variações, monte o carrinho e envie a lista no WhatsApp.
              A confirmação de disponibilidade é feita no atendimento.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
              >
                Ir para o catálogo
              </Link>

              <Link
                href="/carrinho"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
              >
                Abrir carrinho
              </Link>

              <a
                href={whatsappDirect}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
              >
                WhatsApp direto
              </a>
            </div>

            <p className="mt-3 text-xs text-white/50">
              Para enviar a lista do carrinho, use o botão “Enviar lista” abaixo.
            </p>
          </div>

          {/* Blocos laterais */}
          <div className="md:col-span-5">
            <div className="grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Carrinho</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/10">
                    <span suppressHydrationWarning>{totalItems}</span> item(ns)
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/70">Envie a lista pronta no WhatsApp.</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    href="/carrinho"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-white/90"
                  >
                    Finalizar
                  </Link>

                  <button
                    type="button"
                    onClick={openWhatsAppWithCart}
                    disabled={totalItems === 0}
                    className={[
                      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold",
                      totalItems === 0
                        ? "bg-white/10 text-white/40 ring-1 ring-white/10 cursor-not-allowed"
                        : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400",
                    ].join(" ")}
                  >
                    Enviar lista
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">Como funciona</p>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li>1) Escolha os itens e variações</li>
                  <li>2) Ajuste quantidades no carrinho</li>
                  <li>3) Envie a lista no WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-white/40">
        AntiFitness • Catálogo simples e rápido
      </footer>
    </main>
  );
}