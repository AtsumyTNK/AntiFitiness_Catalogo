/* eslint-disable @next/next/no-img-element */
"use client";

import { addToCart } from "@/lib/cart";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Estrutura mínima esperada de /api/products.
 */
type ApiProduct = {
  id: string; // sku
  slug: string;
  name: string;
  description: string;
  images: string[];
  status: "DISPONIVEL" | "SEM_ESTOQUE" | "ENCOMENDA";
  category: string;
  variants: { id: string; label: string; status: "DISPONIVEL" | "SEM_ESTOQUE" | "ENCOMENDA" }[];
};

/**
 * Mensagem padrão exigida:
 * - Deve aparecer em todos os produtos e variações
 */
const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

/**
 * Normaliza slug para comparação segura (case-insensitive, sem query/hash).
 */
function normalizeSlug(input: unknown): string {
  if (typeof input !== "string") return "";
  const noQuery = input.split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(noQuery).trim().toLowerCase();
  } catch {
    return noQuery.trim().toLowerCase();
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * ProdutoClient
 * - Carrega /api/products e filtra pelo slug.
 * - Adiciona ao carrinho sem alert (feedback silencioso no botão).
 */
export default function ProdutoClient(props?: { slug?: string }) {
  const params = useParams<{ slug?: string }>();

  const rawSlug = props?.slug ?? params?.slug;
  const normalizedSlug = useMemo(() => normalizeSlug(rawSlug), [rawSlug]);

  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * UI state:
   * - botão mostra feedback rápido sem alert
   * - erro de estoque aparece como bloco (sem popup)
   */
  const [justAdded, setJustAdded] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    };
  }, []);

  /**
   * Carrega a lista de produtos.
   */
  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch("/api/products", { cache: "no-store" });
        const json = (await res.json()) as { products?: ApiProduct[]; error?: string };

        if (!res.ok) throw new Error(json.error || "Falha ao carregar produtos.");

        if (alive) setItems(json.products ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        if (alive) setLoadError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  /**
   * Seleciona o produto pelo slug normalizado.
   */
  const product = useMemo(() => {
    if (!normalizedSlug) return undefined;
    return items.find((p) => normalizeSlug(p.slug) === normalizedSlug);
  }, [items, normalizedSlug]);

  /**
   * Variações: fallback seguro
   */
  const variantOptions = useMemo(() => {
    if (!product) return [];
    return product.variants?.length
      ? product.variants
      : [{ id: "default", label: "Padrão", status: "ENCOMENDA" as const }];
  }, [product]);

  const firstVariantId = useMemo(() => variantOptions[0]?.id ?? "", [variantOptions]);

  const [variantId, setVariantId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  const effectiveVariantId = variantId || firstVariantId;

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return variantOptions.find((v) => v.id === effectiveVariantId) ?? variantOptions[0] ?? null;
  }, [product, variantOptions, effectiveVariantId]);

  /**
   * Pode adicionar?
   * - Bloqueia somente SEM_ESTOQUE (por segurança)
   */
  const canAdd = useMemo(() => {
    if (!product || !selectedVariant) return false;
    return selectedVariant.status !== "SEM_ESTOQUE";
  }, [product, selectedVariant]);

  /**
   * Adiciona ao carrinho sem alert.
   * Feedback:
   * - muda texto do botão por ~1.2s
   * - se SEM_ESTOQUE: mostra aviso inline
   */
  function add() {
    if (!product || !selectedVariant) return;

    // Limpa avisos anteriores
    setInlineNotice(null);

    if (selectedVariant.status === "SEM_ESTOQUE") {
      setInlineNotice("Sem estoque no momento. Selecione outra variação.");
      return;
    }

    addToCart({
      sku: product.id,
      name: product.name,
      photo: product.images?.[0],
      variantLabel: selectedVariant.label,
      qty,
    });

    // Feedback silencioso
    setJustAdded(true);
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-6">
        <p className="text-sm text-white/70">Carregando produto...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-6 text-center">
        <div className="w-full max-w-xl">
          <p className="text-lg font-semibold">Erro ao carregar produto</p>
          <p className="mt-2 text-sm text-white/60">{loadError}</p>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
              type="button"
            >
              Tentar novamente
            </button>

            <Link
              href="/catalogo"
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 text-center"
            >
              Voltar ao catálogo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-6 text-center">
        <div className="w-full max-w-xl">
          <p className="text-xl font-semibold">Produto não encontrado.</p>
          <p className="mt-2 text-sm text-white/60">
            O slug da URL não foi localizado no retorno de <code>/api/products</code>.
          </p>

          <Link
            href="/catalogo"
            className="mt-6 inline-flex w-full justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 sm:w-auto"
          >
            Ir para o catálogo
          </Link>
        </div>
      </main>
    );
  }

  const img = product.images?.[0] || "/placeholder.png";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="leading-tight">
            <p className="text-xs text-white/50">Produto</p>
            <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/catalogo"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
            >
              Catálogo
            </Link>
            <Link
              href="/carrinho"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90"
            >
              Carrinho
            </Link>
          </div>
        </div>

        {/* Mensagem fixa exigida */}
        <div className="border-t border-white/10 bg-neutral-950/40">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <p className="text-xs text-white/70">{WHATS_AVAILABILITY_NOTE}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Breadcrumb simples */}
        <div className="mb-4 text-sm text-white/60">
          <Link href="/catalogo" className="hover:text-white">
            Catálogo
          </Link>
          <span className="mx-2 text-white/30">/</span>
          <span className="text-white/80">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Coluna da imagem/descrição */}
          <div className="md:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="relative">
                <div className="aspect-4/3 w-full bg-white/5">
                  <img src={img} alt={product.name} className="h-full w-full object-cover opacity-95" />
                </div>

                {/* Aviso exigido também no bloco do produto */}
                <div className="absolute left-4 top-4 max-w-[90%]">
                  <div className="rounded-2xl border border-white/10 bg-neutral-950/55 px-3 py-2 text-xs text-white/80 backdrop-blur">
                    {WHATS_AVAILABILITY_NOTE}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm text-white/60">
                  Categoria: <span className="text-white/85">{product.category}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{product.description}</p>
              </div>
            </div>
          </div>

          {/* Coluna de compra */}
          <aside className="md:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold tracking-tight">{product.name}</h2>

              <p className="mt-2 text-sm text-white/60">{WHATS_AVAILABILITY_NOTE}</p>

              {/* Variação */}
              <div className="mt-5">
                <label className="text-sm font-medium text-white/80">Variação</label>

                <select
                  value={effectiveVariantId}
                  onChange={(e) => {
                    setVariantId(e.target.value);
                    setInlineNotice(null);
                    setJustAdded(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {variantOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>

                {/* Mensagem fixa também no bloco de variação */}
                <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  {WHATS_AVAILABILITY_NOTE}
                </div>

                {/* Aviso inline (sem alert) */}
                {inlineNotice && (
                  <div className="mt-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {inlineNotice}
                  </div>
                )}
              </div>

              {/* Quantidade */}
              <div className="mt-4">
                <label className="text-sm font-medium text-white/80">Quantidade</label>

                <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-neutral-950/40 p-1 ring-1 ring-white/10">
                  <button
                    type="button"
                    onClick={() => setQty((q) => clamp(q - 1, 1, 99))}
                    className="grid h-11 w-12 place-items-center rounded-2xl bg-white/10 text-sm font-semibold hover:bg-white/15"
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>

                  <span className="min-w-10 text-center text-sm font-semibold">{qty}</span>

                  <button
                    type="button"
                    onClick={() => setQty((q) => clamp(q + 1, 1, 99))}
                    className="grid h-11 w-12 place-items-center rounded-2xl bg-white/10 text-sm font-semibold hover:bg-white/15"
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Ações */}
              <div className="mt-6 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={add}
                  disabled={!canAdd}
                  className={[
                    "w-full rounded-2xl px-5 py-3 text-sm font-semibold transition",
                    canAdd
                      ? justAdded
                        ? "bg-white text-neutral-950"
                        : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
                      : "bg-white/10 text-white/40 ring-1 ring-white/10 cursor-not-allowed",
                  ].join(" ")}
                >
                  {canAdd ? (justAdded ? "Adicionado" : "Adicionar ao carrinho") : "Indisponível"}
                </button>

                <Link
                  href="/carrinho"
                  className="w-full rounded-2xl bg-white/10 px-5 py-3 text-center text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
                >
                  Ir para o carrinho
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}