/* eslint-disable @next/next/no-img-element */
"use client";

import { addToCart } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  status: "DISPONIVEL" | "SEM_ESTOQUE" | "ENCOMENDA";
  category: string;
  variants: { id: string; label: string; status: "DISPONIVEL" | "SEM_ESTOQUE" | "ENCOMENDA" }[];
};

const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

/**
 * Normaliza slug para comparação segura.
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

/**
 * Mantém o valor dentro do intervalo permitido.
 */
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export default function ProdutoClient(props?: { slug?: string }) {
  const params = useParams<{ slug?: string }>();

  const rawSlug = props?.slug ?? params?.slug;
  const normalizedSlug = useMemo(() => normalizeSlug(rawSlug), [rawSlug]);

  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * Estado do feedback visual ao adicionar ao carrinho.
   */
  const [justAdded, setJustAdded] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  /**
   * Estado do modal da imagem.
   */
  const [isImageOpen, setIsImageOpen] = useState(false);

  /**
   * Limpa timer do feedback do botão.
   */
  useEffect(() => {
    return () => {
      if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    };
  }, []);

  /**
   * Fecha o modal da imagem ao pressionar ESC.
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsImageOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Carrega os produtos da API.
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
   * Localiza o produto pelo slug da URL.
   */
  const product = useMemo(() => {
    if (!normalizedSlug) return undefined;
    return items.find((p) => normalizeSlug(p.slug) === normalizedSlug);
  }, [items, normalizedSlug]);

  /**
   * Garante uma variação padrão caso não existam variantes.
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

  /**
   * Recupera a variação selecionada com segurança.
   */
  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return variantOptions.find((v) => v.id === effectiveVariantId) ?? variantOptions[0] ?? null;
  }, [product, variantOptions, effectiveVariantId]);

  /**
   * Permite adicionar ao carrinho apenas quando disponível.
   */
  const canAdd = useMemo(() => {
    if (!product || !selectedVariant) return false;
    return selectedVariant.status !== "SEM_ESTOQUE";
  }, [product, selectedVariant]);

  /**
   * Adiciona o item ao carrinho.
   */
  function add() {
    if (!product || !selectedVariant) return;

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

    setJustAdded(true);

    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-white">
        <p className="text-sm text-white/70">Carregando produto...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold">Erro ao carregar produto</p>
          <p className="text-sm text-white/60">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-white">
        <p className="text-xl font-semibold">Produto não encontrado.</p>
      </main>
    );
  }

  const img = product.images?.[0] || "/placeholder.png";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
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
              <p className="text-xs text-white/50">Produto</p>
              <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/catalogo" className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
              Catálogo
            </Link>

            <Link href="/carrinho" className="rounded-xl bg-white px-4 py-2 text-sm text-neutral-950">
              Carrinho
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Imagem */}
          <div className="md:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div
                className="relative aspect-square w-full cursor-zoom-in overflow-hidden bg-white/5"
                onClick={() => setIsImageOpen(true)}
              >
                <Image
                  src={img}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-contain p-3"
                  priority
                />
              </div>

              <div className="p-5">
                <p className="text-sm text-white/60">
                  Categoria: <span className="text-white">{product.category}</span>
                </p>

                <p className="mt-3 text-sm text-white/70">{product.description}</p>
              </div>
            </div>
          </div>

          {/* Compra */}
          <aside className="md:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">{product.name}</h2>

              <p className="mt-2 text-sm text-white/60">{WHATS_AVAILABILITY_NOTE}</p>

              <div className="mt-4">
                <label className="text-sm text-white/70">Variação</label>

                <select
                  value={effectiveVariantId}
                  onChange={(e) => {
                    setVariantId(e.target.value);
                    setInlineNotice(null);
                    setJustAdded(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3"
                >
                  {variantOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {inlineNotice && (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {inlineNotice}
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm text-white/70">Quantidade</label>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQty((q) => clamp(q - 1, 1, 99))}
                    className="rounded-xl bg-white/10 px-4 py-2"
                  >
                    -
                  </button>

                  <span className="px-4 py-2">{qty}</span>

                  <button
                    type="button"
                    onClick={() => setQty((q) => clamp(q + 1, 1, 99))}
                    className="rounded-xl bg-white/10 px-4 py-2"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={add}
                disabled={!canAdd}
                className={[
                  "mt-6 w-full rounded-2xl px-5 py-3 font-semibold transition",
                  canAdd
                    ? justAdded
                      ? "bg-white text-neutral-950"
                      : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
                    : "cursor-not-allowed bg-white/10 text-white/40",
                ].join(" ")}
              >
                {canAdd ? (justAdded ? "Adicionado" : "Adicionar ao carrinho") : "Indisponível"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* Modal da imagem */}
      {isImageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
          onClick={() => setIsImageOpen(false)}
        >
          <div
            className="relative w-full max-w-[92vw] sm:max-w-[80vw] lg:max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageOpen(false)}
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-lg font-bold text-white ring-1 ring-white/20 transition hover:bg-black"
              aria-label="Fechar imagem"
            >
              ×
            </button>

            <div className="relative flex max-h-[85vh] min-h-[280px] items-center justify-center overflow-hidden rounded-3xl bg-white p-3 sm:p-4">
              <div className="relative h-[60vh] w-full max-w-[88vw] sm:h-[68vh] sm:max-w-[72vw] lg:max-w-3xl">
                <Image
                  src={img}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 88vw, (max-width: 1024px) 72vw, 768px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}