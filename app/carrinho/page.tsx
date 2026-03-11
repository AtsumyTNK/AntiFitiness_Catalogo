"use client";

import { CartItem, clearCart, getCart, removeCartItem, updateCartItem } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const WHATS_NUMBER = "5517981229285";
const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

/**
 * Link do nutricionista com mensagem pronta.
 */
const NUTRI_WHATS_NUMBER = "5517997429113";
const NUTRI_WHATS_MESSAGE =
  "Olá! Vim pelo Catálogo Online do AntiFitness e gostaria de falar com o nutricionista.";
const NUTRI_WHATS_LINK = `https://wa.me/${NUTRI_WHATS_NUMBER}?text=${encodeURIComponent(
  NUTRI_WHATS_MESSAGE
)}`;

type CityChoice = "" | "RIO_PRETO" | "OUTRA";

/**
 * Monta a URL do WhatsApp com a mensagem do carrinho.
 */
function buildWhatsUrl(message: string) {
  return `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Compat Layer para suportar formatos antigos e novos do carrinho.
 */
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
  /**
   * hydrated controla a leitura do carrinho apenas no client.
   */
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * Campos usados para entrega local.
   */
  const [city, setCity] = useState<CityChoice>("");
  const [bairro, setBairro] = useState("");
  const [numeroCasa, setNumeroCasa] = useState("");
  const [referencia, setReferencia] = useState("");
  const [periodo, setPeriodo] = useState("");

  useEffect(() => {
    setHydrated(true);
    setItems(getCart());
  }, []);

  /**
   * Total de itens do carrinho.
   */
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

  /**
   * Monta a mensagem que será enviada para o WhatsApp.
   */
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
      {/* Fundo decorativo */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          {/* Marca */}
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
              <p className="text-xs text-white/50">Carrinho</p>
              <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
              <p className="mt-2 text-xs text-white/60">{WHATS_AVAILABILITY_NOTE}</p>
            </div>
          </div>

          {/* Navegação e ação externa */}
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
            <a
              href={NUTRI_WHATS_LINK}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400 md:col-span-1 md:min-h-0"
            >
              Falar com Nutricionista
            </a>

            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15 md:min-h-0"
            >
              Home
            </Link>

            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15 md:min-h-0"
            >
              Catálogo
            </Link>

            <button
              onClick={handleClear}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-40 md:min-h-0"
              type="button"
              disabled={!hydrated || isEmpty}
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:py-8 lg:grid-cols-12">
        {/* Lista do carrinho */}
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
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {items.map((i) => (
                  <div
                    key={getKey(i)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/7 sm:rounded-3xl sm:p-4"
                  >
                    <div className="flex h-full flex-col gap-4">
                      {/* Topo do card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-tight sm:text-base">
                            {getName(i)}
                          </p>
                          <p className="mt-1 text-xs text-white/60 sm:text-sm">
                            {getVariantLabel(i)}
                          </p>
                          <p className="mt-2 text-[10px] text-white/55 sm:text-[11px]">
                            {WHATS_AVAILABILITY_NOTE}
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(i)}
                          className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold ring-1 ring-white/10 transition hover:bg-white/15 sm:rounded-2xl sm:px-4 sm:text-xs"
                          type="button"
                        >
                          Remover
                        </button>
                      </div>

                      {/* Controle de quantidade */}
                      <div className="rounded-2xl bg-neutral-950/40 p-1 ring-1 ring-white/10">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => dec(i)}
                            className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-base font-semibold transition hover:bg-white/15 sm:h-11 sm:w-12 sm:rounded-2xl"
                            type="button"
                          >
                            −
                          </button>

                          <span className="min-w-10 text-center text-base font-semibold">
                            {getQty(i)}
                          </span>

                          <button
                            onClick={() => inc(i)}
                            className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-base font-semibold transition hover:bg-white/15 sm:h-11 sm:w-12 sm:rounded-2xl"
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Rodapé do card */}
                      <span className="text-[11px] text-white/50 sm:text-xs">
                        Ajuste a quantidade antes de finalizar.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Finalização */}
        <aside className="lg:col-span-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
            <h3 className="text-base font-semibold">Finalizar no WhatsApp</h3>
            <p className="mt-2 text-sm text-white/60">
              Selecione sua cidade. Para entrega local, preencha o endereço completo.
            </p>

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
                  <input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Nº da casa</label>
                  <input
                    value={numeroCasa}
                    onChange={(e) => setNumeroCasa(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Local de referência</label>
                  <input
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Preferência de período</label>
                  <input
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                  />
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

            <p className="mt-3 text-xs text-white/45">
              O WhatsApp vai abrir com a mensagem pronta. Basta apertar enviar.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}