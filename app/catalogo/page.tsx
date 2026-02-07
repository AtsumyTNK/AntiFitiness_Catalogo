"use client";

import { addToCart } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * ============================================================
 * Configurações de UI / Mensagens
 * ============================================================
 */

/**
 * Mensagem padrão exigida:
 * - Aparece no topo do catálogo (fixa)
 * - Aparece dentro de cada produto
 * - Aparece no bloco de variações
 */
const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

/**
 * Shape do produto retornado por /api/products.
 * Você definiu que tudo será ENCOMENDA, então tipamos como fixo.
 */
type CatalogProduct = {
  id: string; // sku
  slug: string;
  name: string;
  description: string;
  images: string[];
  status: "ENCOMENDA";
  category: string;
  variants: { id: string; label: string; status: "ENCOMENDA" }[];
  shopee_url?: string;
};

/**
 * Quantidade de cards por página.
 */
const PAGE_SIZE = 9;

/**
 * ============================================================
 * Helpers
 * ============================================================
 */

/**
 * Clamp numérico: mantém n dentro de [min, max].
 */
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Normaliza texto para busca:
 * - trim
 * - lower
 */
function normalizeText(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

/**
 * Normaliza slug para evitar rota inválida e mismatch por encoding:
 * - remove query/hash
 * - decode
 * - trim/lower
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
 * Garante que o src usado no next/image seja sempre uma string válida.
 * - Se vier vazio/nulo, cai no placeholder local.
 */
function safeImageSrc(src: unknown) {
  if (typeof src !== "string") return "/placeholder.png";
  const s = src.trim();
  return s.length > 0 ? s : "/placeholder.png";
}

/**
 * ============================================================
 * Página
 * ============================================================
 */

export default function CatalogoPage() {
  /**
   * Estado: dados vindos do backend (/api/products)
   */
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * Estado: variação selecionada por SKU
   * Ex: selectedVariant["001"] = "250g"
   */
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});

  /**
   * Filtros (status removido: tudo é ENCOMENDA)
   */
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("TODAS");

  /**
   * Paginação
   */
  const [page, setPage] = useState(1);

  /**
   * Carregar produtos do backend.
   * Observação:
   * - Este useEffect é o padrão correto para buscar dados em client components.
   * - O seu ESLint está com uma regra muito restritiva, então desativamos apenas ela neste arquivo.
   */
  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch("/api/products", { cache: "no-store" });
        const json = (await res.json()) as { products?: CatalogProduct[]; error?: string };

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
   * Actions de UI
   */
  function resetToFirstPage() {
    setPage(1);
  }

  function clearFilters() {
    setQ("");
    setCategory("TODAS");
    setPage(1);
  }

  /**
   * Categorias derivadas dos itens:
   * - remove vazios
   * - remove duplicados
   * - adiciona "TODAS" no topo
   */
  const categories = useMemo(() => {
    const set = new Set(
      items
        .map((p) => (typeof p.category === "string" ? p.category.trim() : ""))
        .filter(Boolean)
    );
    return ["TODAS", ...Array.from(set)];
  }, [items]);

  /**
   * Lista filtrada:
   * - busca por name/description
   * - filtra por categoria (se não for TODAS)
   */
  const filtered = useMemo(() => {
    const query = normalizeText(q);

    return items.filter((p) => {
      const name = normalizeText(p.name);
      const desc = normalizeText(p.description);
      const cat = typeof p.category === "string" ? p.category : "";

      const matchesText = !query || name.includes(query) || desc.includes(query);
      const matchesCategory = category === "TODAS" ? true : cat === category;

      return matchesText && matchesCategory;
    });
  }, [items, q, category]);

  /**
   * Total de páginas (nunca menor que 1)
   */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered.length]);

  /**
   * Página segura (se filtro reduzir totalPages)
   */
  const safePage = useMemo(() => clamp(page, 1, totalPages), [page, totalPages]);

  /**
   * Itens desta página
   */
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, safePage]);

  function prevPage() {
    setPage((p) => clamp(p - 1, 1, totalPages));
  }

  function nextPage() {
    setPage((p) => clamp(p + 1, 1, totalPages));
  }

  /**
   * ============================================================
   * Render: Loading / Error
   * ============================================================
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-6">
        <p className="text-sm text-white/70">Carregando produtos...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-6 text-center">
        <div className="w-full max-w-xl">
          <p className="text-lg font-semibold">Erro ao carregar catálogo</p>
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
              href="/"
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 text-center"
            >
              Voltar para Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /**
   * ============================================================
   * Render: Página normal
   * ============================================================
   */
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Decor */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="leading-tight">
            <p className="text-xs text-white/50">Catálogo</p>
            <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
            >
              Home
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

      {/* Filters */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            {/* Busca */}
            <div className="md:col-span-7">
              <label className="text-sm font-medium text-white/80">Buscar</label>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  resetToFirstPage();
                }}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none ring-0 placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Ex: mix, castanha, xilitol..."
              />
            </div>

            {/* Categoria */}
            <div className="md:col-span-5">
              <label className="text-sm font-medium text-white/80">Categoria</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  resetToFirstPage();
                }}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-3 text-sm outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "TODAS" ? "Todas" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-white/70">
              Mostrando <span className="font-semibold text-white">{filtered.length}</span> produto(s)
            </p>

            <button
              onClick={clearFilters}
              className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
              type="button"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      {filtered.length === 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-lg font-semibold">Nenhum produto encontrado.</p>
            <p className="mt-2 text-sm text-white/60">Limpe a busca e volte os filtros para ver os itens.</p>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:justify-center">
              <button
                onClick={clearFilters}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
                type="button"
              >
                Limpar filtros
              </button>
              <Link
                href="/"
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 text-center"
              >
                Voltar para Home
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Grid (mobile-first) */}
          <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((p) => {
              /**
               * Image:
               * - fallback local se vier vazio
               * - evita src inválido no next/image
               */
              const img = safeImageSrc(p.images?.[0]);

              /**
               * Slug blindado:
               * - normaliza antes de montar a rota
               * - se ficar vazio, evita /produto/undefined
               */
              const safeSlug = normalizeSlug(p.slug);

              /**
               * Variações:
               * - garante pelo menos 1 opção se vier vazio
               */
              const variantOptions =
                p.variants?.length > 0
                  ? p.variants
                  : [{ id: "default", label: "Padrão", status: "ENCOMENDA" as const }];

              /**
               * Variação escolhida:
               * - usa a selecionada, senão usa a primeira
               */
              const chosen = selectedVariant[p.id] || variantOptions[0]?.label || "Padrão";

              /**
               * Adiciona item ao carrinho (qty fixo 1 aqui)
               */
              function handleAdd() {
                addToCart({
                  sku: p.id,
                  name: p.name,
                  photo: p.images?.[0],
                  variantLabel: chosen,
                  qty: 1,
                });
              }

              return (
                <article
                  key={p.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:bg-white/7"
                >
                  <div className="relative">
                    <div className="relative aspect-4/3 w-full bg-white/5">
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover opacity-95 transition group-hover:opacity-100"
                      />
                    </div>

                    {/* Mensagem exigida dentro do produto */}
                    <div className="absolute left-3 top-3 max-w-[92%]">
                      <div className="rounded-2xl border border-white/10 bg-neutral-950/55 px-3 py-2 text-xs text-white/80 backdrop-blur">
                        {WHATS_AVAILABILITY_NOTE}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="text-base font-semibold tracking-tight">{p.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-white/65">{p.description}</p>

                    {/* Seletor de variação */}
                    <div className="mt-4">
                      <label className="text-xs font-semibold text-white/70">Variação</label>
                      <select
                        value={chosen}
                        onChange={(e) =>
                          setSelectedVariant((s) => ({
                            ...s,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/40 px-4 py-2 text-sm outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {variantOptions.map((v) => (
                          <option key={v.id} value={v.label}>
                            {v.label}
                          </option>
                        ))}
                      </select>

                      {/* Mensagem exigida dentro das variações */}
                      <p className="mt-2 text-xs text-white/55">{WHATS_AVAILABILITY_NOTE}</p>
                    </div>

                    {/* Ações (mobile-first) */}
                    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Link
                        href={safeSlug ? `/produto/${safeSlug}` : "/catalogo"}
                        aria-disabled={!safeSlug}
                        className={[
                          "rounded-2xl px-4 py-3 text-center text-sm font-semibold",
                          safeSlug
                            ? "bg-white text-neutral-950 hover:bg-white/90"
                            : "bg-white/10 text-white/40 cursor-not-allowed",
                        ].join(" ")}
                      >
                        Ver produto
                      </Link>

                      <button
                        onClick={handleAdd}
                        className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
                        type="button"
                      >
                        Adicionar
                      </button>

                      {p.shopee_url && (
                        <a
                          href={p.shopee_url}
                          target="_blank"
                          rel="noreferrer"
                          className="sm:col-span-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15 text-center"
                        >
                          Shopee
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Pagination */}
          <section className="mx-auto max-w-6xl px-4 pb-12">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={prevPage}
                disabled={safePage <= 1}
                className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 disabled:opacity-40 hover:bg-white/15"
                type="button"
              >
                Anterior
              </button>

              <span className="text-sm text-white/70">
                Página <span className="font-semibold text-white">{safePage}</span> de{" "}
                <span className="font-semibold text-white">{totalPages}</span>
              </span>

              <button
                onClick={nextPage}
                disabled={safePage >= totalPages}
                className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 disabled:opacity-40 hover:bg-white/15"
                type="button"
              >
                Próxima
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}