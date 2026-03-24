"use client";

import { addToCart } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * Mensagem padrão exibida no catálogo e nas páginas relacionadas.
 */
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

/**
 * Shape do produto retornado por /api/products.
 */
type CatalogProduct = {
  id: string;
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
 * Quantidade por página:
 * - mobile: 15
 * - web/tablet: 15
 */
const MOBILE_PAGE_SIZE = 15;
const DESKTOP_PAGE_SIZE = 15;

/**
 * Breakpoint usado para considerar mobile.
 * Aqui seguimos a mesma lógica do Tailwind para telas menores que sm.
 */
const MOBILE_MAX_WIDTH = 639;

/**
 * Mantém o valor dentro do intervalo permitido.
 */
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Normaliza texto para busca.
 */
function normalizeText(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

/**
 * Normaliza o slug antes de montar a rota do produto.
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
 * Garante que a imagem enviada para o next/image seja válida.
 */
function safeImageSrc(src: unknown) {
  if (typeof src !== "string") return "/placeholder.png";
  const s = src.trim();
  return s.length > 0 ? s : "/placeholder.png";
}

/**
 * Faz um corte visual seguro na descrição.
 * Isso evita textos muito grandes no card e mantém o texto completo na página de detalhes.
 */
function truncateDescription(text: string, maxChars: number) {
  const clean = String(text || "").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}...`;
}

export default function CatalogoPage() {
  /**
   * Estado com os produtos vindos da API.
   */
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * Variação escolhida por produto no catálogo.
   */
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});

  /**
   * Filtros do catálogo.
   */
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("TODAS");

  /**
   * Estado da paginação.
   */
  const [page, setPage] = useState(1);

  /**
   * Detecta se está em viewport mobile.
   * Isso afeta apenas a quantidade de produtos por página.
   */
  const [isMobile, setIsMobile] = useState(false);

  /**
   * Faz a tela voltar para o topo de forma suave.
   */
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /**
   * Detecta mobile em tempo real.
   */
  useEffect(() => {
    function checkViewport() {
      setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
    }

    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  /**
   * Carrega os produtos do backend.
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
   * Reseta a paginação ao alterar filtros.
   */
  function resetToFirstPage() {
    setPage(1);
  }

  /**
   * Limpa os filtros ativos.
   */
  function clearFilters() {
    setQ("");
    setCategory("TODAS");
    setPage(1);
    scrollToTop();
  }

  /**
   * Deriva as categorias disponíveis a partir dos produtos carregados.
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
   * Lista filtrada por busca e categoria.
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
   * Tamanho da página depende do tipo de viewport.
   * - mobile: 10
   * - web/tablet: 9
   */
  const pageSize = useMemo(
    () => (isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE),
    [isMobile]
  );

  /**
   * Sempre que o pageSize mudar, garante que a página atual continue válida.
   */
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  /**
   * Total de páginas do catálogo.
   */
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );

  /**
   * Garante que a página atual nunca fique fora do intervalo válido.
   */
  const safePage = useMemo(() => clamp(page, 1, totalPages), [page, totalPages]);

  /**
   * Itens exibidos na página atual.
   */
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, safePage, pageSize]);

  /**
   * Vai para a página anterior e retorna ao topo.
   */
  function prevPage() {
    setPage((p) => clamp(p - 1, 1, totalPages));
    scrollToTop();
  }

  /**
   * Vai para a próxima página e retorna ao topo.
   */
  function nextPage() {
    setPage((p) => clamp(p + 1, 1, totalPages));
    scrollToTop();
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-white">
        <p className="text-sm text-white/70">Carregando produtos...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-white">
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
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
            >
              Voltar para Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Fundo decorativo */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
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
              <p className="text-xs text-white/50">Catálogo</p>
              <h1 className="text-lg font-semibold tracking-tight">AntiFitness</h1>
            </div>
          </div>

          {/* Navegação do topo */}
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
            <a
              href={NUTRI_WHATS_LINK}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400 md:col-span-1 md:min-h-0"
            >
              Falar com Nutricionista
            </a>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15 md:min-h-0"
            >
              Home
            </Link>

            <Link
              href="/carrinho"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-950 hover:bg-white/90 md:min-h-0"
            >
              Carrinho
            </Link>
          </div>
        </div>

        {/* Faixa informativa fixa */}
        <div className="border-t border-white/10 bg-neutral-950/40">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <p className="text-xs text-white/70">{WHATS_AVAILABILITY_NOTE}</p>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
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

      {/* Conteúdo */}
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
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Voltar para Home
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Grade de produtos */}
          <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-3 py-8 sm:grid-cols-2 sm:gap-4 sm:px-4 lg:grid-cols-3">
            {pageItems.map((p) => {
              const img = safeImageSrc(p.images?.[0]);
              const safeSlug = normalizeSlug(p.slug);

              const variantOptions =
                p.variants?.length > 0
                  ? p.variants
                  : [{ id: "default", label: "Padrão", status: "ENCOMENDA" as const }];

              const chosen = selectedVariant[p.id] || variantOptions[0]?.label || "Padrão";
              const shortDescription = truncateDescription(p.description, 180);

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
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:bg-white/7 sm:rounded-3xl"
                >
                  <div className="relative">
                    <div className="relative aspect-square w-full overflow-hidden bg-white/5">
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    <div className="absolute left-2 top-2 max-w-[92%] sm:left-3 sm:top-3">
                      <div className="rounded-xl border border-white/10 bg-neutral-950/55 px-2 py-1 text-[10px] text-white/80 backdrop-blur sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs">
                        {WHATS_AVAILABILITY_NOTE}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <h2 className="min-h-11 text-sm font-semibold tracking-tight sm:text-base lg:min-h-14">
                      {p.name}
                    </h2>

                    {/* Mobile: mantém mais compacto */}
                    <p className="mt-2 hidden text-sm text-white/65 sm:block lg:hidden">
                      {shortDescription}
                    </p>

                    {/* Desktop: área fixa para descrição */}
                    <div className="mt-2 hidden h-27 overflow-hidden lg:block">
                      <p className="text-sm leading-7 text-white/65">{shortDescription}</p>
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <label className="text-[11px] font-semibold text-white/70 sm:text-xs">Variação</label>
                      <select
                        value={chosen}
                        onChange={(e) =>
                          setSelectedVariant((s) => ({
                            ...s,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 sm:rounded-2xl sm:px-4 sm:text-sm"
                      >
                        {variantOptions.map((v) => (
                          <option key={v.id} value={v.label}>
                            {v.label}
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 mb-6 text-[10px] text-white/55 sm:text-xs sm:mb-7">
                        {WHATS_AVAILABILITY_NOTE}
                      </p>
                    </div>

                    <div className="mt-7 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-2 lg:mt-auto">
                      <Link
                        href={safeSlug ? `/produto/${safeSlug}` : "/catalogo"}
                        aria-disabled={!safeSlug}
                        className={[
                          "rounded-xl px-3 py-2 text-center text-xs font-semibold sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm",
                          safeSlug
                            ? "bg-white text-neutral-950 hover:bg-white/90"
                            : "cursor-not-allowed bg-white/10 text-white/40",
                        ].join(" ")}
                      >
                        Ver produto
                      </Link>

                      <button
                        onClick={handleAdd}
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                        type="button"
                      >
                        Adicionar
                      </button>

                      {p.shopee_url && (
                        <a
                          href={p.shopee_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-semibold ring-1 ring-white/10 hover:bg-white/15 sm:col-span-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
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

          {/* Paginação */}
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