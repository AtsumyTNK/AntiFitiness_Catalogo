"use client";

import {
  getCart,
  getItemName,
  getItemQty,
  getItemVariantLabel,
} from "@/lib/cart";
import {
  buildWhatsUrl,
  NUTRI_WHATS_LINK,
  WHATS_AVAILABILITY_NOTE,
  WHATS_NUMBER,
} from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const items = getCart();
    setTotalItems(items.reduce((acc, i) => acc + getItemQty(i), 0));
    setHydrated(true);
  }, []);

  function openWhatsAppWithCart() {
    if (!hydrated) return;
    const items = getCart();
    if (items.length === 0) {
      alert("Seu carrinho está vazio. Adicione produtos antes de enviar no WhatsApp.");
      return;
    }
    const lines = items.map((i) => `- ${getItemQty(i)}x ${getItemName(i)} — ${getItemVariantLabel(i)}`);
    const total = items.reduce((acc, i) => acc + getItemQty(i), 0);
    const message = [
      "Lista – Catálogo AntiFitness",
      "",
      "Itens:",
      ...lines,
      "",
      `Total de itens: ${total}`,
      "",
      WHATS_AVAILABILITY_NOTE,
    ].join("\n");
    window.location.href = buildWhatsUrl(message);
  }

  const cartCount = hydrated ? totalItems : 0;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Fundo decorativo */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[90px]" />
        <div className="absolute -bottom-40 right-0 h-130 w-130 rounded-full bg-sky-500/10 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image src="/logo.svg" alt="Logo AntiFitness" width={40} height={40} className="h-10 w-10 object-contain" priority />
            </div>
            <div className="leading-tight">
              <p className="text-sm text-white/70">Catálogo</p>
              <h1 className="text-base font-semibold tracking-tight">AntiFitness</h1>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
            <a
              href={NUTRI_WHATS_LINK}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400 md:col-span-1 md:min-h-0"
            >
              Falar com Nutricionista
            </a>
            <Link href="/catalogo" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15 md:min-h-0">
              Ver catálogo
            </Link>
            <Link href="/carrinho" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-white/90 md:min-h-0">
              Carrinho ({cartCount})
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/10">
              {WHATS_AVAILABILITY_NOTE}
            </p>

            <div className="mt-4 max-w-2xl">
              <h2 className="leading-[0.98] tracking-tight sm:leading-tight">
                <span className="block text-[2.1rem] font-semibold sm:hidden">
                  <span className="block text-white/95">O poder da</span>
                  <span className="block font-bold text-emerald-400">natureza</span>
                  <span className="mt-2 block text-white/95">na sua rotina</span>
                  <span className="block font-bold text-emerald-400">fitness</span>
                </span>
                <span className="hidden sm:block text-3xl font-semibold md:text-4xl lg:text-5xl">
                  <span className="block text-white/90">O poder da <span className="font-bold text-emerald-400">natureza</span></span>
                  <span className="mt-1 block text-white/90">na sua rotina <span className="font-bold text-emerald-400">fitness</span></span>
                </span>
              </h2>

              <div className="mt-5 space-y-2 sm:mt-6">
                <p className="text-lg font-semibold leading-tight text-white sm:text-xl md:text-2xl">
                  Produtos <span className="text-lime-300">100% naturais</span>
                </p>
                <p className="max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                  Sem agrotóxicos e feitos para melhorar sua performance com equilíbrio e qualidade.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalogo" className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)] hover:bg-emerald-400">
                Ir para o catálogo
              </Link>
              <Link href="/carrinho" className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15">
                Abrir carrinho
              </Link>
              <a
                href={`https://wa.me/${WHATS_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
              >
                WhatsApp direto
              </a>
            </div>
            <p className="mt-3 text-xs text-white/50">Para enviar a lista do carrinho, use o botão "Enviar lista" abaixo.</p>
          </div>

          <div className="md:col-span-5">
            <div className="grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Carrinho</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/10">{cartCount} item(ns)</span>
                </div>
                <p className="mt-2 text-sm text-white/70">Envie a lista pronta no WhatsApp.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link href="/carrinho" className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-white/90">
                    Finalizar
                  </Link>
                  <button
                    type="button"
                    onClick={openWhatsAppWithCart}
                    disabled={!hydrated || cartCount === 0}
                    className={
                      !hydrated || cartCount === 0
                        ? "inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/40 ring-1 ring-white/10"
                        : "inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
                    }
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

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-white/40">
        AntiFitness • Catálogo simples e rápido
      </footer>
    </main>
  );
}
