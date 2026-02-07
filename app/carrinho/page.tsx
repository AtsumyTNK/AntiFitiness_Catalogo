"use client";

import { CartItem, clearCart, getCart, removeCartItem, updateCartItem } from "@/lib/cart";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const WHATS_NUMBER = "5517981229285";
const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

type CityChoice = "" | "RIO_PRETO" | "OUTRA";

function buildWhatsUrl(message: string) {
  return `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Compat Layer (se algum carrinho antigo existir no storage) */
type LegacyCartFields = Partial<{
  productSlug: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
}>;

type NewCartFields = Partial<{
  sku: string;
  name: string;
  variantLabel: string;
  qty: number;
}>;

type CartItemCompat = CartItem & LegacyCartFields & NewCartFields;

function asCompat(i: CartItem): CartItemCompat {
  return i as CartItemCompat;
}

function getQty(i: CartItem): number {
  const c = asCompat(i);
  const raw = c.qty ?? c.quantity ?? 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function getSku(i: CartItem): string {
  const c = asCompat(i);
  return String(c.sku ?? c.productSlug ?? "");
}

function getName(i: CartItem): string {
  const c = asCompat(i);
  return String(c.name ?? c.productName ?? "Produto");
}

function getVariantLabel(i: CartItem): string {
  const c = asCompat(i);
  return String(c.variantLabel ?? c.variantId ?? "Padrão");
}

function getKey(i: CartItem): string {
  return `${getSku(i)}__${getVariantLabel(i)}`;
}

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

  const totalItems = useMemo(() => items.reduce((acc, i) => acc + getQty(i), 0), [items]);

  function sync() {
    setItems(getCart());
  }

  function inc(i: CartItem) {
    updateCartItem({
      sku: getSku(i),
      variantLabel: getVariantLabel(i),
      qty: getQty(i) + 1,
    });
    sync();
  }

  function dec(i: CartItem) {
    updateCartItem({
      sku: getSku(i),
      variantLabel: getVariantLabel(i),
      qty: Math.max(1, getQty(i) - 1),
    });
    sync();
  }

  function removeItem(i: CartItem) {
    removeCartItem({
      sku: getSku(i),
      variantLabel: getVariantLabel(i),
    });
    sync();
  }

  function handleClear() {
    clearCart();
    sync();
  }

  function buildMessage() {
    const lines = items.map((i) => `- ${getQty(i)}x ${getName(i)} — ${getVariantLabel(i)}`);

    if (city === "RIO_PRETO") {
      return [
        "Pedido – Catálogo (Entrega local)",
        "",
        "Cidade: São José do Rio Preto - SP",
        "",
        "Itens:",
        ...lines,
        "",
        `Total de itens: ${totalItems}`,
        "",
        WHATS_AVAILABILITY_NOTE,
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
      "",
      `Total de itens: ${totalItems}`,
      "",
      WHATS_AVAILABILITY_NOTE,
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
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="leading-tight">
            <p className="text-xs text-white/50">Carrinho</p>
            <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
            <p className="mt-2 text-xs text-white/60">{WHATS_AVAILABILITY_NOTE}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15">
              Home
            </Link>

            <Link
              href="/catalogo"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
            >
              Catálogo
            </Link>

            <button
              onClick={handleClear}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-40"
              type="button"
              disabled={!hydrated || isEmpty}
            >
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

              <Link
                href="/catalogo"
                className="rounded-2xl bg-white/10 px-4 py-2 text-center text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
              >
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

                <Link
                  href="/catalogo"
                  className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
                >
                  Ir para o catálogo
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {items.map((i) => (
                  <div key={getKey(i)} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{getName(i)}</p>
                        <p className="mt-1 text-xs text-white/60">{getVariantLabel(i)}</p>
                        <p className="mt-2 text-[11px] text-white/55">{WHATS_AVAILABILITY_NOTE}</p>
                      </div>

                      <button
                        onClick={() => removeItem(i)}
                        className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/15"
                        type="button"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center justify-between gap-2 rounded-2xl bg-neutral-950/40 p-1 ring-1 ring-white/10 w-full sm:w-auto">
                        <button onClick={() => dec(i)} className="grid h-10 w-12 place-items-center rounded-2xl bg-white/10 text-sm font-semibold hover:bg-white/15" type="button">
                          −
                        </button>

                        <span className="min-w-10 text-center text-sm font-semibold">{getQty(i)}</span>

                        <button onClick={() => inc(i)} className="grid h-10 w-12 place-items-center rounded-2xl bg-white/10 text-sm font-semibold hover:bg-white/15" type="button">
                          +
                        </button>
                      </div>

                      <span className="text-xs text-white/50">Ajuste a quantidade antes de finalizar.</span>
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
            <p className="mt-2 text-sm text-white/60">Selecione sua cidade. Para entrega local, preencha o endereço completo.</p>

            <div className="mt-5">
              <label className="text-sm font-medium text-white/80">Você está em São José do Rio Preto?</label>
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                value={city}
                onChange={(e) => setCity(e.target.value as CityChoice)}
                disabled={!hydrated}
              >
                <option value="">Selecione</option>
                <option value="RIO_PRETO">Sim (Entrega local)</option>
                <option value="OUTRA">Não (Compra online)</option>
              </select>
            </div>

            {city === "RIO_PRETO" && hydrated && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-white/80">Bairro / Endereço</label>
                  <input value={bairro} onChange={(e) => setBairro(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Nº da casa</label>
                  <input value={numeroCasa} onChange={(e) => setNumeroCasa(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Local de referência</label>
                  <input value={referencia} onChange={(e) => setReferencia(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Preferência de período</label>
                  <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            )}

            <button
              onClick={openWhatsApp}
              disabled={!hydrated || isEmpty}
              className={[
                "mt-6 w-full rounded-2xl px-5 py-3 text-sm font-semibold",
                !hydrated || isEmpty
                  ? "bg-white/10 text-white/40 ring-1 ring-white/10 cursor-not-allowed"
                  : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400",
              ].join(" ")}
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