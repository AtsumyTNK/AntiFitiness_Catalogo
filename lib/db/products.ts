/**
 * lib/db/products.ts
 *
 * Funções de acesso ao banco de dados (Supabase) para produtos e variações.
 * Usado exclusivamente no lado servidor (Server Components / API Routes).
 *
 * Tabelas utilizadas:
 *  - products         → dados básicos do produto (sku, name, description, photo_url, category)
 *  - product_variants → variações do produto (label, price, price_discounted, sort_order)
 */

import { supabase } from "@/lib/supabase";

/** Linha bruta da tabela `products` no Supabase. */
export type DbProduct = {
  sku: string;
  name: string;
  description: string;
  photo_url: string | null;
  category: string | null;
};

/** Linha bruta da tabela `product_variants` no Supabase. */
export type DbVariant = {
  id: string;
  product_sku: string;
  label: string;
  sort_order: number;
  price: number | null;
  price_discounted: number | null;
};

/** Produto normalizado retornado para o catálogo front-end. */
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  status: "ENCOMENDA";
  category: string;
  variants: {
    id: string;
    label: string;
    status: "ENCOMENDA";
    /** Preço normal em R$ (null se não cadastrado). */
    price: number | null;
    /** Preço com desconto em R$ (null se não cadastrado). */
    price_discounted: number | null;
  }[];
};

/** Converte o nome do produto em slug URL-friendly (sem acentos, minúsculas, hifenizado). */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function normalizeCategory(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

/**
 * Busca todos os produtos e suas variações no Supabase e retorna
 * no formato `CatalogProduct[]` pronto para uso no catálogo.
 *
 * - Produtos sem variações cadastradas recebem uma variação padrão ("Padrão").
 * - Produtos sem foto recebem "/placeholder.png".
 * @throws Error se a consulta ao Supabase falhar.
 */
export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const { data: productsRaw, error: pErr } = await supabase
    .from("products")
    .select("sku,name,description,photo_url,category")
    .order("name", { ascending: true });

  if (pErr) throw new Error(pErr.message);

  const products = (productsRaw ?? []) as DbProduct[];
  if (products.length === 0) return [];

  const { data: variantsRaw, error: vErr } = await supabase
    .from("product_variants")
    .select("id,product_sku,label,sort_order,price,price_discounted")
    .order("sort_order", { ascending: true });

  if (vErr) throw new Error(vErr.message);

  const variants = (variantsRaw ?? []) as DbVariant[];

  // Agrupa variações por SKU do produto para lookup O(1)
  const bySku = new Map<string, DbVariant[]>();
  for (const v of variants) {
    const arr = bySku.get(v.product_sku);
    if (arr) arr.push(v);
    else bySku.set(v.product_sku, [v]);
  }

  return products.map((p) => {
    const v = bySku.get(p.sku) ?? [];
    const slug = slugify(p.name ?? "") || p.sku;
    const imageUrl = p.photo_url || "/placeholder.png";

    const mappedVariants =
      v.length > 0
        ? v.map((x) => ({
            id: x.id,
            label: x.label,
            status: "ENCOMENDA" as const,
            price: x.price ?? null,
            price_discounted: x.price_discounted ?? null,
          }))
        : [{ id: "default", label: "Padrão", status: "ENCOMENDA" as const, price: null, price_discounted: null }];

    return {
      id: p.sku,
      slug,
      name: p.name ?? "",
      description: p.description ?? "",
      images: [imageUrl],
      status: "ENCOMENDA",
      category: normalizeCategory(p.category),
      variants: mappedVariants,
    };
  });
}
