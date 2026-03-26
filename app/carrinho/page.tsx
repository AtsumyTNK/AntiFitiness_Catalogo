"use client";

import {
  CartItem,
  clearCart,
  getCart,
  getEffectivePrice,
  getItemKey,
  getItemName,
  getItemQty,
  getItemSku,
  getItemVariantLabel,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart";
import {
  buildWhatsUrl,
  NUTRI_WHATS_LINK,
  WHATS_AVAILABILITY_NOTE,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CityChoice = "" | "RIO_PRETO" | "OUTRA";

export default function CarrinhoPage() {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [city, setCity] = useState<CityChoice>("");
  const [bairro, setBairro] = useState("");
  const [numeroCasa, setNumeroCasa] = useState("");
  const [referencia, setReferencia] = useState("");
  const [periodo, setPeriodo] = useState("");

  useEffect(() => {
    setHydrated(true);
    setItems(getCart());
  }, []);

  const totalItems = useMemo(() => items.reduce((acc, i) => acc + getItemQty(i), 0), [items]);

  const totals = useMemo(() => {
    let normal = 0;
    let discounted = 0;
    let hasAny = false;
    for (const i of items) {
      const priceNormal = typeof i.price === "number" ? i.price : null;
      const priceEff = getEffectivePrice(i);
      if (priceNormal !== null && priceEff !== null) {
        normal += priceNormal * getItemQty(i);
        discounted += priceEff * getItemQty(i);
        hasAny = true;
      }
    }
    if (!hasAny) return null;
    const discountPct = normal > 0 ? Math.round((1 - discounted / normal) * 100) : 0;
    return { normal, discounted, discountPct };
  }, [items]);

  function sync() {
    setItems(getCart());
  }

  function inc(i: CartItem) {
    updateCartItem({ sku: getItemSku(i), variantLabel: getItemVariantLabel(i), qty: getItemQty(i) + 1 });
    sync();
  }

  function dec(i: CartItem) {
    updateCartItem({ sku: getItemSku(i), variantLabel: getItemVariantLabel(i), qty: Math.max(1, getItemQty(i) - 1) });
    sync();
  }

  function removeItem(i: CartItem) {
    removeCartItem({ sku: getItemSku(i), variantLabel: getItemVariantLabel(i) });
    sync();
  }

  function handleClear() {
    clearCart();
    sync();
  }

  function buildMessage() {
    const lines = items.map((i) => {
      const p = getEffectivePrice(i);
      const priceStr = p !== null ? ` — ${formatPrice(p)} un.` : "";
      return `- ${getItemQty(i)}x ${getItemName(i)} — ${getItemVariantLabel(i)}${priceStr}`;
    });

    const totalLines: string[] = [];
    if (totals !== null) {
      totalLines.push(
        totals.discountPct > 0
          ? `O Preço total seria de ${formatPrice(totals.normal)}, mas com o desconto de ${totals.discountPct}% ele irá ficar por apenas *${formatPrice(totals.discounted)}*`
          : `Total: *${formatPrice(totals.discounted)}*`
      );
    }

    const baseLines = [
      "",
      `Total de itens: ${totalItems}`,
      ...totalLines,
      "",
      WHATS_AVAILABILITY_NOTE,
    ];

    if (city === "RIO_PRETO") {
      return [
        "Pedido – Catálogo (Entrega local)",
        "",
        "Cidade: São José do Rio Preto - SP",
        "",
        "Itens:",
        ...lines,
        ...baseLines,
        "",
        "Endereço:",
        `- Bairro/Endereço: ${bairro || "(não informado)"}`,
        `- Nº: ${numeroCasa || "(não informado)"}`,
        `- Referência: ${referencia || "(não informado)"}`,
        `- Preferência de período: ${periodo || "(não informado)"}`,
      ].join("\n");
    }

    return [
      "Lista – Compra online (fora de São José do Rio Preto)",
      "",
      "Quero os links/onde comprar destes itens:",
      ...lines,
      ...baseLines,
    ].join("\n");
  }

  function openWhatsApp() {
    if (!hydrated || items.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }
    if (!city) {
      alert("Selecione se você está em São José do Rio Preto ou em outra cidade.");
      return;
    }
    window.location.href = buildWhatsUrl(buildMessage());
  }

  const isEmpty = items.length === 0;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image src="/logo.svg" alt="Logo AntiFitness" width={40} height={40} className="h-10 w-10 object-contain" priority />
            </div>
            <div className="leading-tight">
              <p className="text-xs text-white/50">Carrinho</p>
              <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
              <p className="mt-2 text-xs text-white/60">{WHATS_AVAILABILITY_NOTE}</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
            <a href={NUTRI_WHATS_LINK} target="_blank" rel="noreferrer" className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400 md:col-span-1 md:min-h-0">
              Falar com Nutricionista
            </a>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15 md:min-h-0">
              Home
            </Link>
            <Link href="/catalogo" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15 md:min-h-0">
              Catálogo
            </Link>
            <button onClick={handleClear} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-40 md:min-h-0" type="button" disabled={!hydrated || isEmpty}>
              Limpar
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:py-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Itens do carrinho</h2>
                <p className="mt-1 text-sm text-white/60">
                  Total de itens: <span className="font-semibold text-white">{hydrated ? totalItems : "—"}</span>
                </p>
              </div>
              <Link href="/catalogo" className="rounded-2xl bg-white/10 px-4 py-2 text-center text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15">
                Adicionar mais
              </Link>
            </div>

            {!hydrated ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-sm text-white/70">Carregando carrinho...</p>
              </div>
            ) : isEmpty ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-lg font-semibold">Seu carrinho está vazio.</p>
                <p className="mt-2 text-sm text-white/60">Volte ao catálogo e selecione seus produtos.</p>
                <Link href="/catalogo" className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400">
                  Ir para o catálogo
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((i) => (
                  <div key={getItemKey(i)} className="rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/7 sm:rounded-3xl sm:p-4">
                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-tight sm:text-base">{getItemName(i)}</p>
                          <p className="mt-1 text-xs text-white/60 sm:text-sm">{getItemVariantLabel(i)}</p>
                          <p className="mt-2 text-[10px] text-white/55 sm:text-[11px]">{WHATS_AVAILABILITY_NOTE}</p>
                        </div>
                        <button onClick={() => removeItem(i)} className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold ring-1 ring-white/10 transition hover:bg-white/15 sm:rounded-2xl sm:px-4 sm:text-xs" type="button">
                          Remover
                        </button>
                      </div>

                      <div className="rounded-2xl bg-neutral-950/40 p-1 ring-1 ring-white/10">
                        <div className="flex items-center justify-between gap-2">
                          <button onClick={() => dec(i)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-base font-semibold transition hover:bg-white/15 sm:w-12 sm:rounded-2xl" type="button">−</button>
                          <span className="min-w-10 text-center text-base font-semibold">{getItemQty(i)}</span>
                          <button onClick={() => inc(i)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-base font-semibold transition hover:bg-white/15 sm:w-12 sm:rounded-2xl" type="button">+</button>
                        </div>
                      </div>

                      <span className="text-[11px] text-white/50 sm:text-xs">Ajuste a quantidade antes de finalizar.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
            <h3 className="text-base font-semibold">Finalizar no WhatsApp</h3>
            <p className="mt-3 text-sm text-white/60">Selecione sua cidade. Para entrega local, preencha o endereço completo.</p>

            <div className="mt-5">
              <label className="text-sm font-medium text-white/80">Você está em São José do Rio Preto?</label>
              <select className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50" value={city} onChange={(e) => setCity(e.target.value as CityChoice)} disabled={!hydrated}>
                <option value="">Selecione</option>
                <option value="RIO_PRETO">Sim (Entrega local)</option>
                <option value="OUTRA">Não (Compra online)</option>
              </select>
            </div>

            {city === "RIO_PRETO" && hydrated && (
              <div className="mt-4 space-y-3">
                {[
                  { label: "Bairro / Endereço", value: bairro, set: setBairro },
                  { label: "Nº da casa", value: numeroCasa, set: setNumeroCasa },
                  { label: "Local de referência", value: referencia, set: setReferencia },
                  { label: "Preferência de período", value: periodo, set: setPeriodo },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-sm font-medium text-white/80">{label}</label>
                    <input value={value} onChange={(e) => set(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={openWhatsApp}
              disabled={!hydrated || isEmpty}
              className={`mt-6 w-full rounded-2xl px-5 py-3 text-sm font-semibold ${!hydrated || isEmpty ? "cursor-not-allowed bg-white/10 text-white/40 ring-1 ring-white/10" : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400"}`}
              type="button"
            >
              Enviar no WhatsApp
            </button>
            <p className="mt-3 text-xs text-white/45">O WhatsApp vai abrir com a mensagem pronta. Basta apertar enviar.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
